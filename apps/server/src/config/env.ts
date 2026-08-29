import { config } from 'dotenv';
import path from 'node:path';

const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : process.env.NODE_ENV === 'test'
      ? '.env.test'
      : '.env.local';
config({ path: path.resolve(process.cwd(), envFile) });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  mongoUri: required('MONGO_URI'),
  redisUrl: required('REDIS_URL'),
  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    accessExpiry: process.env.JWT_ACCESS_EXPIRY ?? '15m',
    refreshSecret: required('JWT_REFRESH_SECRET'),
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY ?? '30d',
  },
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  razorpay: {
    keyId: required('RAZORPAY_KEY_ID'),
    keySecret: required('RAZORPAY_KEY_SECRET'),
  },
  s3: {
    endpoint: required('S3_ENDPOINT'),
    bucket: required('S3_BUCKET'),
    accessKey: required('S3_ACCESS_KEY'),
    secretKey: required('S3_SECRET_KEY'),
  },
  // Certificate verification links point here — the client origin, not the
  // API's own origin, since /verify/:token is meant to be a public page a
  // recruiter opens in a browser, not a raw API JSON response.
  publicAppUrl: process.env.PUBLIC_APP_URL ?? process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
};
