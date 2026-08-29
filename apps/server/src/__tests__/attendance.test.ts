import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { Role } from '@forge-loom/shared-types';
import { buildApp, connectDb, disconnectDb, createTestUser } from './helpers.js';
import { CourseAdminProfileModel } from '../models/CourseAdminProfile.js';
import { CourseModel } from '../models/Course.js';
import { EnrollmentModel } from '../models/Enrollment.js';
import { CourseSessionModel } from '../models/CourseSession.js';
import { AttendanceRecordModel } from '../models/AttendanceRecord.js';

const app = buildApp();

beforeAll(async () => {
  await connectDb();
});

afterAll(async () => {
  await disconnectDb();
});

describe('attendance marking', () => {
  it('lets the assigned trainer mark present/absent, blocks a non-enrolled student, and lets the student read their own history back', async () => {
    const {
      user: trainerUser,
      email: trainerEmail,
      password: trainerPw,
    } = await createTestUser(Role.Trainer);
    const {
      user: studentUser,
      email: studentEmail,
      password: studentPw,
    } = await createTestUser(Role.Student);
    const { user: outsiderUser } = await createTestUser(Role.Student);
    const { user: adminUser } = await createTestUser(Role.CourseAdmin);

    const adminProfile = await CourseAdminProfileModel.create({
      userId: adminUser._id,
      name: 'Attendance Test Admin',
    });
    const course = await CourseModel.create({
      title: 'Offline Attendance Course',
      createdBy: adminProfile._id,
      deliveryMode: 'offline',
      durationHours: 10,
      durationDays: 1,
      price: 0,
      status: 'published',
      trainerId: trainerUser._id,
      syllabus: [{ dayNumber: 1, title: 'Day 1', youtubeVideoId: null }],
    });
    const session = await CourseSessionModel.create({
      courseId: course._id,
      dayNumber: 1,
      scheduledDate: new Date(),
      mode: 'offline',
      status: 'scheduled',
      trainerId: trainerUser._id,
    });
    await EnrollmentModel.create({
      studentId: studentUser._id,
      courseId: course._id,
      status: 'active',
      paymentAmount: 0,
    });

    const trainerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: trainerEmail, password: trainerPw });
    const trainerToken = trainerLogin.body.accessToken as string;

    const markResult = await request(app)
      .post(`/api/sessions/${session._id.toString()}/attendance`)
      .set('Authorization', `Bearer ${trainerToken}`)
      .send({
        records: [{ studentId: studentUser._id.toString(), status: 'present' }],
      });
    expect(markResult.status).toBe(200);

    const rejectedOutsider = await request(app)
      .post(`/api/sessions/${session._id.toString()}/attendance`)
      .set('Authorization', `Bearer ${trainerToken}`)
      .send({
        records: [{ studentId: outsiderUser._id.toString(), status: 'present' }],
      });
    expect(rejectedOutsider.status).toBe(400);

    const stored = await AttendanceRecordModel.findOne({
      sessionId: session._id,
      studentId: studentUser._id,
    });
    expect(stored?.status).toBe('present');

    // Re-marking the same student updates the existing record rather than duplicating it.
    await request(app)
      .post(`/api/sessions/${session._id.toString()}/attendance`)
      .set('Authorization', `Bearer ${trainerToken}`)
      .send({
        records: [{ studentId: studentUser._id.toString(), status: 'absent' }],
      });
    const recordCount = await AttendanceRecordModel.countDocuments({
      sessionId: session._id,
      studentId: studentUser._id,
    });
    expect(recordCount).toBe(1);
    const updated = await AttendanceRecordModel.findOne({
      sessionId: session._id,
      studentId: studentUser._id,
    });
    expect(updated?.status).toBe('absent');

    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: studentEmail, password: studentPw });
    const historyRes = await request(app)
      .get(
        `/api/students/${studentUser._id.toString()}/attendance?courseId=${course._id.toString()}`
      )
      .set('Authorization', `Bearer ${studentLogin.body.accessToken}`);

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.attendance).toHaveLength(1);
    expect(historyRes.body.attendance[0].status).toBe('absent');
  });

  it('blocks a role other than trainer from marking attendance', async () => {
    const { user: adminUser } = await createTestUser(Role.CourseAdmin);
    const { email: studentEmail, password: studentPw } = await createTestUser(Role.Student);

    const adminProfile = await CourseAdminProfileModel.create({
      userId: adminUser._id,
      name: 'Another Admin',
    });
    const course = await CourseModel.create({
      title: 'Blocked Attendance Course',
      createdBy: adminProfile._id,
      deliveryMode: 'offline',
      durationHours: 1,
      durationDays: 1,
      price: 0,
      status: 'published',
      syllabus: [],
    });
    const session = await CourseSessionModel.create({
      courseId: course._id,
      dayNumber: 1,
      scheduledDate: new Date(),
      mode: 'offline',
      status: 'scheduled',
    });

    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: studentEmail, password: studentPw });

    const res = await request(app)
      .post(`/api/sessions/${session._id.toString()}/attendance`)
      .set('Authorization', `Bearer ${studentLogin.body.accessToken}`)
      .send({ records: [] });

    expect(res.status).toBe(403);
  });
});
