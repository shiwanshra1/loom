import mongoose from 'mongoose';

// Runs once before the whole suite, in a separate process from the test
// files themselves (vitest's globalSetup contract) — drops the dedicated
// forgeloom_test database so every run starts from a clean slate instead of
// accumulating fixture data across runs. Never touches the real dev
// database (a different name, set in apps/server/.env.test).
export default async function setup() {
  process.env.NODE_ENV = 'test';
  const { config } = await import('dotenv');
  const path = await import('node:path');
  config({ path: path.resolve(process.cwd(), '.env.test') });

  const uri = process.env.MONGO_URI;
  if (!uri || !uri.includes('forgeloom_test')) {
    throw new Error(
      `Refusing to run tests: MONGO_URI does not point at forgeloom_test (got: ${uri})`
    );
  }

  const connection = await mongoose.createConnection(uri).asPromise();
  await connection.dropDatabase();
  await connection.close();
}
