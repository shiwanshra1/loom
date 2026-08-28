import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { courseRouter } from './modules/courses/course.routes.js';
import { enrollmentRouter } from './modules/enrollments/enrollment.routes.js';
import { catalogRouter } from './modules/catalog/catalog.routes.js';
import { sessionRouter, studentAttendanceRouter } from './modules/sessions/session.routes.js';
import { videoProgressRouter } from './modules/videoProgress/videoProgress.routes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  if (env.nodeEnv !== 'test') {
    app.use(morgan('dev'));
  }

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/courses', courseRouter);
  app.use('/api/enrollments', enrollmentRouter);
  app.use('/api/catalog', catalogRouter);
  app.use('/api/sessions', sessionRouter);
  app.use('/api/students', studentAttendanceRouter);
  app.use('/api/video-progress', videoProgressRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
