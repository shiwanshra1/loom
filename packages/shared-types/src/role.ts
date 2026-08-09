export enum Role {
  Student = 'student',
  Mentor = 'mentor',
  Trainer = 'trainer',
  Speaker = 'speaker',
  Hr = 'hr',
  Sponsor = 'sponsor',
  CollegeAdmin = 'college_admin',
  CommunityLeader = 'community_leader',
  MediaPartner = 'media_partner',
  Member = 'member',
  ForgeAdmin = 'forge_admin',
}

export const ROLES: Role[] = Object.values(Role);

/** Roles whose data is always scoped to a single college (see architecture doc §4.3). */
export const COLLEGE_SCOPED_ROLES: Role[] = [Role.Student, Role.Mentor, Role.Trainer, Role.CollegeAdmin];

/** Forge Admin is an internal superuser role — never exposed on the public register endpoint. */
export const SELF_REGISTERABLE_ROLES: Role[] = ROLES.filter((role) => role !== Role.ForgeAdmin);
