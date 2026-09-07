import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { Role } from '@forge-loom/shared-types';
import { buildApp, connectDb, disconnectDb, createTestUser } from './helpers.js';
import { prisma } from '../config/prisma.js';

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

    const adminProfile = await prisma.courseAdminProfile.create({
      data: { userId: adminUser.id, name: 'Attendance Test Admin' },
    });
    const course = await prisma.course.create({
      data: {
        title: 'Offline Attendance Course',
        createdBy: adminProfile.id,
        deliveryMode: 'offline',
        durationHours: 10,
        durationDays: 1,
        price: 0,
        status: 'published',
        trainerId: trainerUser.id,
        syllabus: { create: [{ dayNumber: 1, title: 'Day 1', youtubeVideoId: null }] },
      },
    });
    const session = await prisma.courseSession.create({
      data: {
        courseId: course.id,
        dayNumber: 1,
        scheduledDate: new Date(),
        mode: 'offline',
        status: 'scheduled',
        trainerId: trainerUser.id,
      },
    });
    await prisma.enrollment.create({
      data: {
        studentId: studentUser.id,
        courseId: course.id,
        status: 'active',
        paymentAmount: 0,
      },
    });

    const trainerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: trainerEmail, password: trainerPw });
    const trainerToken = trainerLogin.body.accessToken as string;

    const markResult = await request(app)
      .post(`/api/sessions/${session.id}/attendance`)
      .set('Authorization', `Bearer ${trainerToken}`)
      .send({
        records: [{ studentId: studentUser.id, status: 'present' }],
      });
    expect(markResult.status).toBe(200);

    const rejectedOutsider = await request(app)
      .post(`/api/sessions/${session.id}/attendance`)
      .set('Authorization', `Bearer ${trainerToken}`)
      .send({
        records: [{ studentId: outsiderUser.id, status: 'present' }],
      });
    expect(rejectedOutsider.status).toBe(400);

    const stored = await prisma.attendanceRecord.findUnique({
      where: { sessionId_studentId: { sessionId: session.id, studentId: studentUser.id } },
    });
    expect(stored?.status).toBe('present');

    // Re-marking the same student updates the existing record rather than duplicating it.
    await request(app)
      .post(`/api/sessions/${session.id}/attendance`)
      .set('Authorization', `Bearer ${trainerToken}`)
      .send({
        records: [{ studentId: studentUser.id, status: 'absent' }],
      });
    const recordCount = await prisma.attendanceRecord.count({
      where: { sessionId: session.id, studentId: studentUser.id },
    });
    expect(recordCount).toBe(1);
    const updated = await prisma.attendanceRecord.findUnique({
      where: { sessionId_studentId: { sessionId: session.id, studentId: studentUser.id } },
    });
    expect(updated?.status).toBe('absent');

    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: studentEmail, password: studentPw });
    const historyRes = await request(app)
      .get(`/api/students/${studentUser.id}/attendance?courseId=${course.id}`)
      .set('Authorization', `Bearer ${studentLogin.body.accessToken}`);

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.attendance).toHaveLength(1);
    expect(historyRes.body.attendance[0].status).toBe('absent');
  });

  it('blocks a role other than trainer from marking attendance', async () => {
    const { user: adminUser } = await createTestUser(Role.CourseAdmin);
    const { email: studentEmail, password: studentPw } = await createTestUser(Role.Student);

    const adminProfile = await prisma.courseAdminProfile.create({
      data: { userId: adminUser.id, name: 'Another Admin' },
    });
    const course = await prisma.course.create({
      data: {
        title: 'Blocked Attendance Course',
        createdBy: adminProfile.id,
        deliveryMode: 'offline',
        durationHours: 1,
        durationDays: 1,
        price: 0,
        status: 'published',
      },
    });
    const session = await prisma.courseSession.create({
      data: {
        courseId: course.id,
        dayNumber: 1,
        scheduledDate: new Date(),
        mode: 'offline',
        status: 'scheduled',
      },
    });

    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: studentEmail, password: studentPw });

    const res = await request(app)
      .post(`/api/sessions/${session.id}/attendance`)
      .set('Authorization', `Bearer ${studentLogin.body.accessToken}`)
      .send({ records: [] });

    expect(res.status).toBe(403);
  });
});
