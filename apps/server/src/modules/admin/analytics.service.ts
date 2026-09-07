import type {
  AnalyticsDto,
  AttendanceTrendPointDto,
  ScoreDistributionBucketDto,
} from '@forge-loom/shared-types';
import { prisma } from '../../config/prisma.js';

const ATTENDANCE_TREND_DAYS = 7;
const SCORE_BUCKETS = [
  { label: '0-20', min: 0, max: 20 },
  { label: '20-40', min: 20, max: 40 },
  { label: '40-60', min: 40, max: 60 },
  { label: '60-80', min: 60, max: 80 },
  { label: '80-100', min: 80, max: 101 },
];

async function getCourseCompletionRate(): Promise<number> {
  const [completed, active] = await Promise.all([
    prisma.enrollment.count({ where: { status: 'completed' } }),
    prisma.enrollment.count({ where: { status: 'active' } }),
  ]);
  const total = completed + active;
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

async function getScoreDistribution(): Promise<ScoreDistributionBucketDto[]> {
  const students = await prisma.studentProfile.findMany({ select: { builderScore: true } });
  return SCORE_BUCKETS.map((bucket) => ({
    label: bucket.label,
    count: students.filter((s) => s.builderScore >= bucket.min && s.builderScore < bucket.max)
      .length,
  }));
}

// "excused" absences are dropped from the rate rather than counted either
// way — they're neither an attendance signal nor a gap to flag.
async function getAttendanceTrend(): Promise<AttendanceTrendPointDto[]> {
  const since = new Date();
  since.setDate(since.getDate() - (ATTENDANCE_TREND_DAYS - 1));
  since.setHours(0, 0, 0, 0);

  const records = await prisma.attendanceRecord.findMany({
    where: { markedAt: { gte: since } },
    select: { status: true, markedAt: true },
  });

  const points: AttendanceTrendPointDto[] = [];
  for (let i = 0; i < ATTENDANCE_TREND_DAYS; i++) {
    const day = new Date(since);
    day.setDate(day.getDate() + i);
    const dayEnd = new Date(day);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const dayRecords = records.filter((r) => r.markedAt >= day && r.markedAt < dayEnd);
    const countable = dayRecords.filter((r) => r.status !== 'excused');
    const present = countable.filter((r) => r.status === 'present').length;

    points.push({
      dateLabel: day.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
      ratePercent: countable.length === 0 ? 0 : Math.round((present / countable.length) * 100),
    });
  }
  return points;
}

async function getCitadelFunnel() {
  const [interestedRows, teamsFormed, sprintsCompleted, investorGranted] = await Promise.all([
    prisma.interestExpression.findMany({ distinct: ['userId'], select: { userId: true } }),
    prisma.team.count({ where: { problemStatementId: { not: null } } }),
    prisma.sprint.count({ where: { status: 'complete' } }),
    prisma.investorAccessGrant.count(),
  ]);
  return {
    interested: interestedRows.length,
    teamsFormed,
    sprintsCompleted,
    investorGranted,
  };
}

export async function getAnalytics(): Promise<AnalyticsDto> {
  const [courseCompletionRatePercent, scoreDistribution, attendanceTrend, citadelFunnel] =
    await Promise.all([
      getCourseCompletionRate(),
      getScoreDistribution(),
      getAttendanceTrend(),
      getCitadelFunnel(),
    ]);

  return { courseCompletionRatePercent, scoreDistribution, attendanceTrend, citadelFunnel };
}
