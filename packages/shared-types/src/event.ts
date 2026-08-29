export type EventType = 'hackathon' | 'seminar' | 'workshop' | 'other';

export interface EventDto {
  id: string;
  title: string;
  description?: string;
  type: EventType;
  hostedByEmail: string;
  collegeName?: string;
  venue?: string;
  scheduledAt: string;
  agenda: string[];
  featured: boolean;
  registeredCount: number;
  // Viewer-scoped
  isRegistered: boolean;
}
