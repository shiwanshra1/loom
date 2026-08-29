import type { Role } from './role.js';
import type { UserStatus } from './user.js';

export interface NationalStatsDto {
  totalColleges: number;
  totalStudents: number;
  venturesLaunched: number;
  employabilityLiftPercent: number | null;
}

export interface AdminUserRowDto {
  id: string;
  email: string;
  role: Role;
  collegeName: string | null;
  status: UserStatus;
}

export interface ScoreDistributionBucketDto {
  label: string;
  count: number;
}

export interface AttendanceTrendPointDto {
  dateLabel: string;
  ratePercent: number;
}

export interface CitadelFunnelDto {
  interested: number;
  teamsFormed: number;
  sprintsCompleted: number;
  investorGranted: number;
}

export interface AnalyticsDto {
  courseCompletionRatePercent: number;
  scoreDistribution: ScoreDistributionBucketDto[];
  attendanceTrend: AttendanceTrendPointDto[];
  citadelFunnel: CitadelFunnelDto;
}
