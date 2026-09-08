import nodemailer from 'nodemailer';
import { env } from './env.js';

export const mailTransporter = nodemailer.createTransport({
  host: env.mail.host,
  port: env.mail.port,
  secure: env.mail.port === 465,
  auth: { user: env.mail.user, pass: env.mail.pass },
});
