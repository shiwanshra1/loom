import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDb } from './config/db.js';

async function main(): Promise<void> {
  await connectDb();

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`Forge Loom API listening on port ${env.port}`);
  });
}

main().catch((error: unknown) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
