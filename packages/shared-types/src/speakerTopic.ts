export type SpeakerTopicStatus = 'proposed' | 'booked';

export interface SpeakerTopicDto {
  id: string;
  title: string;
  description?: string;
  status: SpeakerTopicStatus;
  scheduledAt: string | null;
  venue: string | null;
  createdAt: string;
}
