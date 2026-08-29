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
import { courseProgressRouter } from './modules/progress/courseProgress.routes.js';
import { collegeRouter } from './modules/colleges/college.routes.js';
import { cohortRouter } from './modules/cohorts/cohort.routes.js';
import { teamRouter } from './modules/teams/team.routes.js';
import { problemStatementRouter } from './modules/problemStatements/problemStatement.routes.js';
import { sprintRouter } from './modules/sprints/sprint.routes.js';
import { certificateRouter } from './modules/certificates/certificate.routes.js';
import { bookingRouter } from './modules/bookings/booking.routes.js';
import { notificationRouter } from './modules/notifications/notification.routes.js';
import { eventRouter } from './modules/events/event.routes.js';
import { accessRequestRouter } from './modules/accessRequests/accessRequest.routes.js';
import { communityRouter } from './modules/community/community.routes.js';
import { speakerTopicRouter } from './modules/speakerTopics/speakerTopic.routes.js';
import { talentPoolRouter } from './modules/talentPool/talentPool.routes.js';
import { hrProfileRouter } from './modules/hrProfile/hrProfile.routes.js';
import { communityMemberRouter } from './modules/communityMembers/communityMember.routes.js';
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
  app.use('/api/students', courseProgressRouter);
  app.use('/api/video-progress', videoProgressRouter);
  app.use('/api/colleges', collegeRouter);
  app.use('/api/cohorts', cohortRouter);
  app.use('/api/teams', teamRouter);
  app.use('/api/problem-statements', problemStatementRouter);
  app.use('/api/sprints', sprintRouter);
  app.use('/api/certificates', certificateRouter);
  app.use('/api/bookings', bookingRouter);
  app.use('/api/notifications', notificationRouter);
  app.use('/api/events', eventRouter);
  app.use('/api/access-requests', accessRequestRouter);
  app.use('/api/community', communityRouter);
  app.use('/api/speaker-topics', speakerTopicRouter);
  app.use('/api/talent-pool', talentPoolRouter);
  app.use('/api/hr-profile', hrProfileRouter);
  app.use('/api/community-members', communityMemberRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
