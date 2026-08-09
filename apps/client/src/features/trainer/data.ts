import { useQuery } from '@tanstack/react-query';

// Mock/placeholder — Trainer's backend doesn't exist yet (Phase D is UI-only,
// built from the text wireframe spec since there's no visual reference for
// this role). Same shape as Mentor per wireframes.md §3.

export interface TrainerStats {
  studentsAssigned: number;
  coursesTeaching: number;
  sessionsToday: number;
  pendingGrading: number;
}

export interface TrainerStudent {
  id: string;
  name: string;
  course: string;
  score: number;
  lastActivityLabel: string;
}

export interface TrainerCourse {
  id: string;
  name: string;
  studentsEnrolled: number;
  progressPercent: number;
}

export interface Submission {
  id: string;
  studentName: string;
  assignmentTitle: string;
  submittedLabel: string;
  status: 'pending' | 'graded';
  grade?: number;
}

export interface TrainerTeam {
  id: string;
  name: string;
  problemStatementTitle: string;
  sprintStatus: string;
}

const MOCK_STATS: TrainerStats = {
  studentsAssigned: 32,
  coursesTeaching: 3,
  sessionsToday: 2,
  pendingGrading: 9,
};

const MOCK_STUDENTS: TrainerStudent[] = [
  {
    id: 'st-1',
    name: 'Kabir Malhotra',
    course: 'Full Stack Web Development',
    score: 88,
    lastActivityLabel: '1h ago',
  },
  {
    id: 'st-2',
    name: 'Ishita Sharma',
    course: 'Data Structures & Algorithms',
    score: 76,
    lastActivityLabel: '3h ago',
  },
  {
    id: 'st-3',
    name: 'Aditya Kumar',
    course: 'Full Stack Web Development',
    score: 91,
    lastActivityLabel: '5h ago',
  },
  {
    id: 'st-4',
    name: 'Aryan Desai',
    course: 'Database Management Systems',
    score: 68,
    lastActivityLabel: '1d ago',
  },
];

const MOCK_COURSES: TrainerCourse[] = [
  { id: 'crs-1', name: 'Full Stack Web Development', studentsEnrolled: 18, progressPercent: 70 },
  { id: 'crs-2', name: 'Data Structures & Algorithms', studentsEnrolled: 14, progressPercent: 55 },
  { id: 'crs-3', name: 'Database Management Systems', studentsEnrolled: 10, progressPercent: 30 },
];

const MOCK_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-1',
    studentName: 'Kabir Malhotra',
    assignmentTitle: 'REST API Design',
    submittedLabel: '2h ago',
    status: 'pending',
  },
  {
    id: 'sub-2',
    studentName: 'Ishita Sharma',
    assignmentTitle: 'Sorting Algorithms Quiz',
    submittedLabel: '1d ago',
    status: 'pending',
  },
  {
    id: 'sub-3',
    studentName: 'Aditya Kumar',
    assignmentTitle: 'REST API Design',
    submittedLabel: '3d ago',
    status: 'graded',
    grade: 92,
  },
];

const MOCK_TEAMS: TrainerTeam[] = [
  {
    id: 'team-alpha',
    name: 'Team Alpha',
    problemStatementTitle: 'Sustainable Campus Solutions',
    sprintStatus: 'Sprint 2 — In Progress',
  },
  {
    id: 'team-beta',
    name: 'Team Beta',
    problemStatementTitle: 'Student Mental Health Support',
    sprintStatus: 'Sprint 2 — In Progress',
  },
];

export function useTrainerStats() {
  return useQuery({ queryKey: ['trainer', 'stats'], queryFn: () => Promise.resolve(MOCK_STATS) });
}
export function useTrainerStudents() {
  return useQuery({
    queryKey: ['trainer', 'students'],
    queryFn: () => Promise.resolve(MOCK_STUDENTS),
  });
}
export function useTrainerCourses() {
  return useQuery({
    queryKey: ['trainer', 'courses'],
    queryFn: () => Promise.resolve(MOCK_COURSES),
  });
}
export function useTrainerSubmissions() {
  return useQuery({
    queryKey: ['trainer', 'submissions'],
    queryFn: () => Promise.resolve(MOCK_SUBMISSIONS),
  });
}
export function useTrainerTeams() {
  return useQuery({ queryKey: ['trainer', 'teams'], queryFn: () => Promise.resolve(MOCK_TEAMS) });
}
