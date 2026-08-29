import type {
  AnalyticsDto,
  AttendanceTrendPointDto,
  ScoreDistributionBucketDto,
} from '@forge-loom/shared-types';
import { EnrollmentModel } from '../../models/Enrollment.js';
import { AttendanceRecordModel } from '../../models/AttendanceRecord.js';
import { StudentProfileModel } from '../../models/StudentProfile.js';
import { InterestExpressionModel } from '../../models/InterestExpression.js';
import { TeamModel } from '../../models/Team.js';
import { SprintModel } from '../../models/Sprint.js';
import { InvestorAccessGrantModel } from '../../models/InvestorAccessGrant.js';

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
    EnrollmentModel.countDocuments({ status: 'completed' }),
    EnrollmentModel.countDocuments({ status: 'active' }),
  ]);
  const total = completed + active;
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

async function getScoreDistribution(): Promise<ScoreDistributionBucketDto[]> {
  const students = await StudentProfileModel.find().select('builderScore');
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

  const records = await AttendanceRecordModel.find({ markedAt: { $gte: since } }).select(
    'status markedAt'
  );

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
  const [interested, teamsFormed, sprintsCompleted, investorGranted] = await Promise.all([
    InterestExpressionModel.distinct('userId').then((ids) => ids.length),
    TeamModel.countDocuments({ problemStatementId: { $ne: null } }),
    SprintModel.countDocuments({ status: 'complete' }),
    InvestorAccessGrantModel.countDocuments(),
  ]);
  return { interested, teamsFormed, sprintsCompleted, investorGranted };
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
