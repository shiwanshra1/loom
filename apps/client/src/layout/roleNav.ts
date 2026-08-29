import {
  Home,
  Presentation,
  Mic,
  Briefcase,
  HeartHandshake,
  Landmark,
  UsersRound,
  Newspaper,
  UserRound,
  ShieldCheck,
  BookOpen,
  Calendar,
  TrendingUp,
  Castle,
  UserRound as MentorIcon,
  PartyPopper,
  Users,
  Layers,
  CalendarClock,
  Search,
  GraduationCap,
  Award,
  type LucideIcon,
} from 'lucide-react';
import { Role } from '@forge-loom/shared-types';
import { ROLE_HOME_PATH } from '../auth/roleHome';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

// Phase A shipped one nav item per role; Phase B fleshes out Student's full
// section list as its real routes land. Phase C/D do the same for the rest.
export const ROLE_NAV: Record<Role, NavItem[]> = {
  [Role.Student]: [
    { label: 'Home', path: '/student', icon: Home },
    { label: 'Courses', path: '/student/courses', icon: BookOpen },
    { label: 'Browse Catalog', path: '/student/catalog', icon: Search },
    { label: 'Calendar', path: '/student/calendar', icon: Calendar },
    { label: 'Tracker', path: '/student/tracker', icon: TrendingUp },
    { label: 'Citadel', path: '/student/citadel', icon: Castle },
    { label: 'Mentor', path: '/student/mentor', icon: MentorIcon },
    { label: 'Certifications', path: '/student/certifications', icon: Award },
    { label: 'Events', path: '/student/events', icon: PartyPopper },
  ],
  [Role.Mentor]: [
    { label: 'Dashboard', path: '/mentor', icon: Home },
    { label: 'Students', path: '/mentor/students', icon: Users },
    { label: 'Teams', path: '/mentor/teams', icon: Layers },
    { label: 'Sessions', path: '/mentor/sessions', icon: CalendarClock },
  ],
  [Role.Trainer]: [{ label: 'Dashboard', path: ROLE_HOME_PATH[Role.Trainer], icon: Presentation }],
  [Role.Speaker]: [{ label: 'Sessions', path: ROLE_HOME_PATH[Role.Speaker], icon: Mic }],
  [Role.Hr]: [
    { label: 'Dashboard', path: ROLE_HOME_PATH[Role.Hr], icon: Briefcase },
    { label: 'Talent Pool', path: '/hr/talent-pool', icon: Search },
  ],
  [Role.Sponsor]: [
    { label: 'Dashboard', path: ROLE_HOME_PATH[Role.Sponsor], icon: HeartHandshake },
  ],
  [Role.CollegeAdmin]: [
    { label: 'Dashboard', path: ROLE_HOME_PATH[Role.CollegeAdmin], icon: Landmark },
  ],
  [Role.CommunityLeader]: [
    { label: 'Dashboard', path: ROLE_HOME_PATH[Role.CommunityLeader], icon: UsersRound },
  ],
  [Role.MediaPartner]: [
    { label: 'Dashboard', path: ROLE_HOME_PATH[Role.MediaPartner], icon: Newspaper },
  ],
  [Role.Member]: [{ label: 'Feed', path: ROLE_HOME_PATH[Role.Member], icon: UserRound }],
  [Role.ForgeAdmin]: [
    { label: 'Dashboard', path: ROLE_HOME_PATH[Role.ForgeAdmin], icon: ShieldCheck },
  ],
  [Role.CourseAdmin]: [{ label: 'My Courses', path: '/course-admin', icon: GraduationCap }],
};
