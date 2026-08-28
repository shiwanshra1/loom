export type SprintTaskStatus = 'pending' | 'in_progress' | 'completed';
export type SprintStatus = 'not_started' | 'in_progress' | 'submitted' | 'reviewed' | 'complete';

export interface SprintTaskDto {
  title: string;
  status: SprintTaskStatus;
  dueDate: string;
}

export interface MilestoneFeedbackDto {
  mentorId: string;
  comment: string;
  rating?: number;
  createdAt: string;
}

export interface MilestoneSubmissionDto {
  id: string;
  sprintId: string;
  artifactUrls: string[];
  demoDate: string | null;
  mentorFeedback: MilestoneFeedbackDto[];
  createdAt: string;
}

export interface SprintDto {
  id: string;
  teamId: string;
  cycleNumber: number;
  status: SprintStatus;
  startDate: string;
  endDate: string;
  tasks: SprintTaskDto[];
  progressPercent: number;
}

export interface TeamSprintsDto {
  team: {
    id: string;
    name: string;
    problemStatementTitle: string | null;
    trainerEmail: string | null;
    mentorEmail: string | null;
    memberCount: number;
  };
  sprints: SprintDto[];
  submissionsBySprintId: Record<string, MilestoneSubmissionDto[]>;
  investorAccessGranted: boolean;
}
