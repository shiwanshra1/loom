import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { Role } from '@forge-loom/shared-types';
import { buildApp, connectDb, disconnectDb, uniqueEmail } from './helpers.js';
import { UserModel } from '../models/User.js';

const app = buildApp();

beforeAll(async () => {
  await connectDb();
});

afterAll(async () => {
  await disconnectDb();
});

describe('auth flow', () => {
  const email = uniqueEmail('auth');
  const password = 'a-real-password-1';

  it('registers a new (non-college-scoped) role', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email,
      password,
      displayName: 'Auth Test HR',
      role: Role.Hr,
    });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.role).toBe('hr');
    expect(typeof res.body.accessToken).toBe('string');
  });

  it('rejects a duplicate email on register', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email,
      password,
      displayName: 'Duplicate',
      role: Role.Hr,
    });

    expect(res.status).toBe(409);
  });

  it('logs in with the correct password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email, password });

    expect(res.status).toBe(200);
    expect(typeof res.body.accessToken).toBe('string');
  });

  it('rejects the wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'definitely-wrong' });

    expect(res.status).toBe(401);
  });

  it('blocks login for a suspended account', async () => {
    await UserModel.updateOne({ email }, { status: 'suspended' });

    const res = await request(app).post('/api/auth/login').send({ email, password });

    expect(res.status).toBe(403);

    await UserModel.updateOne({ email }, { status: 'active' });
  });

  it('rejects /me without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('accepts /me with a valid access token', async () => {
    const login = await request(app).post('/api/auth/login').send({ email, password });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
  });

  it('mints a fresh access token via the refresh cookie', async () => {
    const agent = request.agent(app);
    const login = await agent.post('/api/auth/login').send({ email, password });
    expect(login.status).toBe(200);

    const refreshed = await agent.post('/api/auth/refresh');
    expect(refreshed.status).toBe(200);
    expect(typeof refreshed.body.accessToken).toBe('string');

    // Confirm the refreshed token is genuinely usable, not just non-empty —
    // token strings can be byte-identical to the login token when minted in
    // the same second (JWT `iat` has 1-second resolution and nothing else in
    // the payload changes), so equality with the old token isn't meaningful.
    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${refreshed.body.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(email);
  });

  it('rejects a refresh with no cookie at all', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.status).toBe(401);
  });
});
