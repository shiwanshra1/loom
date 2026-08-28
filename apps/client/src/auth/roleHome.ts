import { Role } from '@forge-loom/shared-types';

/** Landing dashboard per role, per architecture doc §10. */
export const ROLE_HOME_PATH: Record<Role, string> = {
  [Role.Student]: '/student',
  [Role.Mentor]: '/mentor',
  [Role.Trainer]: '/trainer',
  [Role.Speaker]: '/speaker',
  [Role.Hr]: '/hr',
  [Role.Sponsor]: '/sponsor',
  [Role.CollegeAdmin]: '/college',
  [Role.CommunityLeader]: '/community',
  [Role.MediaPartner]: '/media',
  [Role.Member]: '/member',
  [Role.ForgeAdmin]: '/admin',
  [Role.CourseAdmin]: '/course-admin',
};

export const ROLE_LABELS: Record<Role, string> = {
  [Role.Student]: 'Student',
  [Role.Mentor]: 'Mentor',
  [Role.Trainer]: 'Trainer',
  [Role.Speaker]: 'Speaker',
  [Role.Hr]: 'HR',
  [Role.Sponsor]: 'Sponsor',
  [Role.CollegeAdmin]: 'College Admin',
  [Role.CommunityLeader]: 'Community Leader',
  [Role.MediaPartner]: 'Media Partner',
  [Role.Member]: 'Member',
  [Role.ForgeAdmin]: 'Forge Admin',
  [Role.CourseAdmin]: 'Course Admin',
};
