export type BookingStatus = 'upcoming' | 'completed' | 'cancelled';

export interface BookingDto {
  id: string;
  requesterId: string;
  requesterEmail: string;
  mentorId: string;
  mentorEmail: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  mode: string;
  status: BookingStatus;
  agenda: string[];
  note?: string;
  meetingLink?: string;
}
