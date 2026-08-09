import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDb(): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri);
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
