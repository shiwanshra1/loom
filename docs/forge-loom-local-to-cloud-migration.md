# Forge Loom — Local Development → Cloud Migration Guide
### Companion to `forge-loom-architecture.md` and `forge-loom-wireframes.md`

This covers building the backend entirely on your laptop first, then moving to a cloud provider once the core is working — without having to rewrite anything when you do.

---

## 1. The principle that makes this migration painless

**Never hardcode a database location, credential, or bucket name anywhere in application code.** Every environment-specific value — Mongo connection string, Redis URL, JWT secret, S3 bucket/keys — lives in environment variables, read once at startup. If you follow this from line one, migrating from local to cloud later is a matter of changing a `.env` file, not touching code.

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
| MongoDB | Docker container (`mongo:7`) — do **not** install Mongo natively, Docker keeps it disposable and identical to what you'll run in staging |
| Redis | Docker container (`redis:7`) |
| API (Express + TS) | Runs directly with `ts-node-dev` / `nodemon` — no need to containerize this yet |
| Client (React + TS) | Vite dev server |
| File storage | Local filesystem or MinIO (an S3-compatible Docker container) — this is the one piece worth emulating early, since your certificate/PDF/resume upload code will call the same S3 SDK either way |

### 2.2 Minimal `docker-compose.yml` for local infra
```yaml
version: "3.8"
services:
  mongo:
    image: mongo:7
    ports: ["27017:27017"]
    volumes: ["mongo_data:/data/db"]
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
  mongo_data:
  minio_data:
```
Run `docker compose up -d` and you have Mongo, Redis, and S3-compatible storage running locally in under a minute, with zero cloud accounts needed yet.

### 2.3 `.env.local` example
```
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/forgeloom
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=dev-only-secret-change-me
JWT_REFRESH_SECRET=dev-only-secret-change-me-2
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=forgeloom-dev
S3_ACCESS_KEY=forgeloom
S3_SECRET_KEY=forgeloom123
```

### 2.4 Build order (matches the architecture doc's phased roadmap)
1. Auth + all 11 role profile schemas against local Mongo.
2. Core academic structure (colleges, cohorts, courses, teams) + Student/Mentor/Trainer dashboards.
3. Citadel sprint state machine.
4. Score engine + certifications — this is where you first exercise Redis/BullMQ locally, so get the queue running early even with dummy jobs.
5. HR Talent Pool search — you can prototype filtering against plain Mongo queries locally; swapping in Atlas Search happens at the cloud step, not before (see §4).
6. Everything working end-to-end locally, seeded with realistic fake data (aim for a few thousand fake student records to catch slow queries before they're a surprise in production).

---

## 3. Choosing where to deploy

Since the stack is MERN, the natural cloud database is **MongoDB Atlas** (MongoDB's own managed cloud service) — not Firebase. This is worth being explicit about:

> **A note on Firebase**: Firebase's database is **Firestore**, a different NoSQL database with a different query model and SDK — it is not a hosting option for MongoDB. Moving to Firebase would mean rewriting your data layer (all Mongoose schemas, all queries), not just changing a connection string. If Firebase was on your list because of familiarity or its auth/hosting features, it's worth knowing that going that route means abandoning the MongoDB-based architecture in this project, not migrating it. The rest of this guide assumes you stay on MongoDB and use Atlas.

### 3.1 Where the pieces live once you go to the cloud

| Piece | Recommended cloud home | Why |
|---|---|---|
| MongoDB | **MongoDB Atlas** (any cloud region — Atlas itself runs on top of AWS/GCP/Azure, you just pick a region) | Purpose-built for Mongo, handles replica sets/backups/scaling for you, includes Atlas Search for the Talent Pool |
| Redis | Managed Redis (Upstash, Redis Cloud, or your cloud provider's managed Redis) | Avoid self-hosting Redis in production — persistence/failover is easy to get wrong |
| API + background workers | **AWS (ECS/Elastic Beanstalk)**, **DigitalOcean App Platform**, or **Render/Railway** | Any of these can run your containerized Express app and BullMQ workers; pick based on budget and how much infra you want to manage yourself (see §3.2) |
| File storage | AWS S3 (or DigitalOcean Spaces, which is S3-API-compatible) | Same SDK calls as your local MinIO setup — only the endpoint/credentials change |
| Search | MongoDB Atlas Search (bundled with Atlas) | No separate service to run |

### 3.2 Picking an app-hosting provider for 5k–50k users

| Provider | Good fit if... | Tradeoff |
|---|---|---|
| **Render / Railway** | You want to deploy fast and not manage servers; good up to tens of thousands of users with their scaled plans | Less fine-grained control than raw AWS; costs scale with usage |
| **DigitalOcean App Platform** | You want simplicity similar to Render but with DigitalOcean's pricing/ecosystem, and may want Spaces (S3-alt) in the same account | Slightly less "batteries included" than Render for background workers |
| **AWS (ECS Fargate or Elastic Beanstalk)** | You want maximum scaling control and are comfortable with more setup, or you're already committed to AWS elsewhere | More setup work (VPC, load balancer, task definitions) before you get your first deploy live |

For a first production launch, **Render or DigitalOcean App Platform + MongoDB Atlas** is the least-friction path that still comfortably supports your 5k–50k user target — you can always move the compute layer to raw AWS later without touching Atlas, since the database and app-hosting decisions are independent of each other.

---

## 4. The actual migration steps (local → cloud)

1. **Create the Atlas cluster** (start on the free/shared tier for staging, upgrade to a dedicated tier — M10+ — before real user load). Whitelist your deploy environment's IP or use Atlas's VPC peering if your host supports it.
2. **Point a staging `.env`** (`MONGO_URI` = your Atlas connection string) at the new cluster and run the app against it locally first — confirms the connection works before anything is public.
3. **Migrate data, if any exists locally worth keeping**:
   ```
   mongodump --uri="mongodb://localhost:27017/forgeloom" --out=./dump
   mongorestore --uri="<your atlas connection string>" ./dump
   ```
   For a fresh project with only seed/test data, skip this — just re-seed against Atlas directly.
4. **Recreate indexes** — indexes defined in Mongoose schemas (`schema.index(...)`) are created automatically on first connection, but double-check compound indexes described in the architecture doc (§6) actually exist on the Atlas cluster via Atlas's Indexes tab before going live.
5. **Set up Atlas Search** for the Talent Pool once you're on Atlas — this doesn't exist locally in the same form, so this is the one feature you finish configuring at this stage rather than earlier.
6. **Swap Redis and S3 the same way**: stand up managed Redis and an S3 bucket, update env vars, no code changes if you followed §1.
7. **Deploy the app** to your chosen host (§3.2), pointing its production env vars at Atlas/Redis/S3.
8. **Set up backups and monitoring before onboarding real users**: Atlas has automated backups built in — turn them on; set up basic uptime/error monitoring (even a free tier of Sentry or your host's built-in logs) so you're not flying blind at 5k+ users.

---

## 5. Pre-launch checklist

- [ ] All secrets (JWT keys, DB credentials, S3 keys) are environment variables, not committed to git
- [ ] `.env.example` documents every required variable for anyone else setting up the project
- [ ] Compound indexes from the architecture doc's §6 exist on the Atlas cluster
- [ ] Atlas Search index configured for `studentProfiles` (skills, domain, score)
- [ ] Redis-backed BullMQ workers are running as a separate deployed process/service, not inside the same process as the API
- [ ] Atlas automated backups enabled
- [ ] Rate limiting in place on public endpoints (especially the certificate verification endpoint, which is unauthenticated)
- [ ] Load test with a realistic seed dataset (aim for the low end of your 5k–50k target) before opening real registration
