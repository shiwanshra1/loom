import { useQuery } from '@tanstack/react-query';

// Mock/placeholder — built from wireframes.md §5. The Talent Pool is flagged
// there as "the important one" (search + filter + pagination from day one);
// this mock version has the same shape as the eventual Atlas Search-backed
// endpoint would return, just paginated over a small in-memory array.

export interface HrCompanyProfile {
  companyName: string;
  industry: string;
  description: string;
}

export interface HrUpcomingEvent {
  id: string;
  title: string;
  dateLabel: string;
}

export interface TalentProfile {
  id: string;
  name: string;
  domain: string;
  skills: string[];
  score: number;
  college: string;
  bio: string;
  projects: { title: string; description: string }[];
}

const MOCK_COMPANY: HrCompanyProfile = {
  companyName: 'TechNova',
  industry: 'Software / SaaS',
  description: 'We build developer tools used by teams worldwide.',
};

const MOCK_EVENTS: HrUpcomingEvent[] = [
  { id: 'ev-1', title: 'Hackathon Kickoff 2026', dateLabel: '5 Jun 2026' },
  { id: 'ev-2', title: 'Campus Placement Drive', dateLabel: '12 Jun 2026' },
];

const MOCK_TALENT_POOL: TalentProfile[] = [
  {
    id: 't-1',
    name: 'Neha Gupta',
    domain: 'UI/UX',
    skills: ['Figma', 'Design Systems', 'User Research'],
    score: 91,
    college: 'Forge Institute of Technology',
    bio: 'Aspiring product designer with a focus on accessible design.',
    projects: [
      { title: 'Campus Waste Tracker', description: 'Led design for a sustainability app.' },
    ],
  },
  {
    id: 't-2',
    name: 'Rohan Mehta',
    domain: 'Full Stack',
    skills: ['React', 'Node.js', 'MongoDB'],
    score: 88,
    college: 'Forge Institute of Technology',
    bio: 'Full stack developer who loves clean APIs.',
    projects: [
      {
        title: 'Peer Support Platform',
        description: 'Built the backend for a mental health support app.',
      },
    ],
  },
  {
    id: 't-3',
    name: 'Aditya Kumar',
    domain: 'Full Stack',
    skills: ['TypeScript', 'React', 'PostgreSQL'],
    score: 85,
    college: 'Forge Institute of Technology',
    bio: 'Enjoys building performant web apps.',
    projects: [
      { title: 'Marketplace App', description: 'Built a local business marketplace end to end.' },
    ],
  },
  {
    id: 't-4',
    name: 'Simran Kaur',
    domain: 'Backend',
    skills: ['Python', 'Django', 'Redis'],
    score: 79,
    college: 'Forge Institute of Technology',
    bio: 'Backend-focused engineer interested in distributed systems.',
    projects: [
      {
        title: 'Smart Attendance System',
        description: 'Designed the facial-recognition pipeline.',
      },
    ],
  },
];

export function useHrCompanyProfile() {
  return useQuery({
    queryKey: ['hr', 'company-profile'],
    queryFn: () => Promise.resolve(MOCK_COMPANY),
  });
}
export function useHrUpcomingEvents() {
  return useQuery({
    queryKey: ['hr', 'upcoming-events'],
    queryFn: () => Promise.resolve(MOCK_EVENTS),
  });
}
export function useTalentPool() {
  return useQuery({
    queryKey: ['hr', 'talent-pool'],
    queryFn: () => Promise.resolve(MOCK_TALENT_POOL),
  });
}
