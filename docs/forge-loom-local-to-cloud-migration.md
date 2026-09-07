# Forge Loom — Local Development → Cloud Migration Guide
### Companion to `forge-loom-architecture.md` and `forge-loom-wireframes.md`

This covers building the backend entirely on your laptop first, then moving to a cloud provider once the core is working — without having to rewrite anything when you do.

---

## 1. The principle that makes this migration painless

**Never hardcode a database location, credential, or bucket name anywhere in application code.** Every environment-specific value — Postgres connection string (`DATABASE_URL`), Redis URL, JWT secret, S3 bucket/keys — lives in environment variables, read once at startup. If you follow this from line one, migrating from local to cloud later is a matter of changing a `.env` file, not touching code.

```
apps/server/
├── .env.local          # your laptop — gitignored
├── .env.production     # cloud — gitignored, values set in host's dashboard/secrets manager instead
└── .env.example        # committed — documents every required variable, no real values
```

Load with `dotenv` locally; in production, the host (Render/Railway/AWS/etc.) injects env vars directly and you don't ship a `.env` file at all.

---

## 2. Local development setup

### 2.1 What runs on your laptop
| Service | Local option |
|---|---|
| PostgreSQL | Docker container (`postgres:16`) — do **not** install Postgres natively, Docker keeps it disposable and identical to what you'll run in staging |
| Redis | Docker container (`redis:7`) |
| API (Express + TS) | Runs directly with `tsx watch` — no need to containerize this yet |
| Client (React + TS) | Vite dev server |
| File storage | Local filesystem or MinIO (an S3-compatible Docker container) — this is the one piece worth emulating early, since your certificate/PDF/resume upload code will call the same S3 SDK either way |

### 2.2 Minimal `docker-compose.yml` for local infra
```yaml
services:
  postgres:
    image: postgres:16
    ports: ["5432:5432"]
    environment:
      POSTGRES_USER: forgeloom
      POSTGRES_PASSWORD: forgeloom
      POSTGRES_DB: forgeloom_dev
    volumes: ["postgres_data:/var/lib/postgresql/data"]
  redis:
    image: redis:7
    ports: ["6379:6379"]
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports: ["9000:9000", "9001:9001"]
    environment:
      MINIO_ROOT_USER: forgeloom
      MINIO_ROOT_PASSWORD: forgeloom123
    volumes: ["minio_data:/data"]
volumes:
  postgres_data:
  minio_data:
```
Run `docker compose up -d` and you have Postgres, Redis, and S3-compatible storage running locally in under a minute, with zero cloud accounts needed yet. `prisma migrate dev` (against `DATABASE_URL` pointing at this container) creates and evolves the schema — there's no separate "create the database" step the way a schemaless document store needs none at all.

### 2.3 `.env.local` example
```
NODE_ENV=development
DATABASE_URL=postgresql://forgeloom:forgeloom@localhost:5432/forgeloom_dev
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=dev-only-secret-change-me
JWT_REFRESH_SECRET=dev-only-secret-change-me-2
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=forgeloom-dev
S3_ACCESS_KEY=forgeloom
S3_SECRET_KEY=forgeloom123
```

### 2.4 Build order (matches the architecture doc's phased roadmap)
1. Auth + all 11 role profile tables against local Postgres.
2. Core academic structure (colleges, cohorts, courses, teams) + Student/Mentor/Trainer dashboards.
3. Citadel sprint state machine.
4. Score engine + certifications — this is where you first exercise Redis/BullMQ locally, so get the queue running early even with dummy jobs.
5. HR Talent Pool search — you can prototype filtering against plain indexed Postgres queries locally; layering in `tsvector`/`pg_trgm` full-text search happens once you actually need it, not before (see §4).
6. Everything working end-to-end locally, seeded with realistic fake data (aim for a few thousand fake student records to catch slow queries before they're a surprise in production).

---

## 3. Choosing where to deploy

Since the stack is PERN, the cloud database is a **managed PostgreSQL** instance — not Firebase, and not MongoDB Atlas. This is worth being explicit about:

> **A note on Firebase**: Firebase's database is **Firestore**, a NoSQL document store with a different query model and SDK entirely — moving to it would mean rewriting the whole data layer (every Prisma model, every query), not just changing a connection string. Forge Loom evaluated and explicitly rejected a Firebase migration (see `docs/archive/`) in favor of staying relational. The rest of this guide assumes managed Postgres.

### 3.1 Where the pieces live once you go to the cloud

| Piece | Recommended cloud home | Why |
|---|---|---|
| PostgreSQL | **Managed Postgres** — pick one: **Neon** or **Supabase** (serverless-friendly, generous free/hobby tiers, branching for preview environments), **AWS RDS for PostgreSQL** or **Google Cloud SQL** (if you're already committed to that cloud), or your app-hosting provider's own managed Postgres add-on (Render/Railway both offer one) | Handles backups/failover/point-in-time-recovery for you; Prisma talks to any of these identically via `DATABASE_URL` — the choice is purely about pricing/ops preference, not a code decision |
| Redis | Managed Redis (Upstash, Redis Cloud, or your cloud provider's managed Redis) | Avoid self-hosting Redis in production — persistence/failover is easy to get wrong |
| API + background workers | **AWS (ECS/Elastic Beanstalk)**, **DigitalOcean App Platform**, or **Render/Railway** | Any of these can run your containerized Express app and BullMQ workers; pick based on budget and how much infra you want to manage yourself (see §3.2) |
| File storage | AWS S3 (or DigitalOcean Spaces, which is S3-API-compatible) | Same SDK calls as your local MinIO setup — only the endpoint/credentials change |
| Search | Postgres full-text search (`tsvector`/`pg_trgm`) on the same managed instance, no separate service | Sufficient at the 5k–50k target; graduate to Elasticsearch/Meilisearch only if query volume genuinely outgrows it |

### 3.2 Picking an app-hosting provider for 5k–50k users

| Provider | Good fit if... | Tradeoff |
|---|---|---|
| **Render / Railway** | You want to deploy fast and not manage servers; good up to tens of thousands of users with their scaled plans | Less fine-grained control than raw AWS; costs scale with usage |
| **DigitalOcean App Platform** | You want simplicity similar to Render but with DigitalOcean's pricing/ecosystem, and may want Spaces (S3-alt) in the same account | Slightly less "batteries included" than Render for background workers |
| **AWS (ECS Fargate or Elastic Beanstalk)** | You want maximum scaling control and are comfortable with more setup, or you're already committed to AWS elsewhere | More setup work (VPC, load balancer, task definitions) before you get your first deploy live |

For a first production launch, **Render or DigitalOcean App Platform + Neon/Supabase (or the host's own managed Postgres add-on)** is the least-friction path that still comfortably supports your 5k–50k user target — you can always move the compute layer to raw AWS later without touching the database provider, since the database and app-hosting decisions are independent of each other.

---

## 4. The actual migration steps (local → cloud)

1. **Provision the managed Postgres instance** (start on the free/hobby tier for staging, upgrade to a production tier with connection pooling — e.g. Neon's autoscaling compute, or RDS with PgBouncer — before real user load). Whitelist your deploy environment's IP or use the provider's private networking/VPC peering if it supports it.
2. **Point a staging `.env`** (`DATABASE_URL` = your managed instance's connection string) at the new database and run `prisma migrate deploy` against it — this applies every committed migration in `apps/server/prisma/migrations/` in order, confirming the schema and the connection both work before anything is public.
3. **Migrate data, if any exists locally worth keeping**: run `apps/server/src/scripts/migrateMongoToPostgres.ts` (see `docs/prisma-migration-tickets.md` Phase 8) if you're carrying forward data from the pre-Postgres MongoDB era, or `pg_dump`/`pg_restore` for moving between two Postgres instances (e.g. local → staging). For a fresh project with only seed/test data, skip this — just re-seed against the managed instance directly (`npm run seed`).
4. **Confirm indexes exist** — every index/unique constraint is declared directly in `schema.prisma` and created by `prisma migrate deploy` itself, so there's no separate "recreate indexes" step the way a schemaless store needs; just confirm `prisma migrate status` shows a clean, fully-applied state before going live.
5. **Add full-text search for the Talent Pool once you actually need it** — `tsvector` columns + GIN indexes on `student_profiles`, added as their own Prisma migration; this doesn't exist by default so it's the one feature worth finishing at this stage rather than earlier, same as Atlas Search was in the Mongo-era version of this doc.
6. **Swap Redis and S3 the same way**: stand up managed Redis and an S3 bucket, update env vars, no code changes if you followed §1.
7. **Deploy the app** to your chosen host (§3.2), pointing its production env vars at the managed Postgres/Redis/S3.
8. **Set up backups and monitoring before onboarding real users**: most managed Postgres providers (Neon, Supabase, RDS, Cloud SQL) have automated backups/point-in-time-recovery built in — turn it on; set up basic uptime/error monitoring (even a free tier of Sentry or your host's built-in logs) so you're not flying blind at 5k+ users.

---

## 5. Pre-launch checklist

- [ ] All secrets (JWT keys, `DATABASE_URL`, S3 keys) are environment variables, not committed to git
- [ ] `.env.example` documents every required variable for anyone else setting up the project
- [ ] `prisma migrate status` shows every migration applied cleanly on the production database
- [ ] Full-text search (`tsvector`/GIN index) configured for `student_profiles` (skills, domain, score) if Talent Pool query volume warrants it
- [ ] Redis-backed BullMQ workers are running as a separate deployed process/service, not inside the same process as the API
- [ ] Automated backups / point-in-time recovery enabled on the managed Postgres instance
- [ ] Connection pooling in place (PgBouncer, or the provider's built-in pooler) if the host environment is serverless/autoscaling, since Postgres connections are far more limited than MongoDB's
- [ ] Rate limiting in place on public endpoints (especially the certificate verification endpoint, which is unauthenticated)
- [ ] Load test with a realistic seed dataset (aim for the low end of your 5k–50k target) before opening real registration
