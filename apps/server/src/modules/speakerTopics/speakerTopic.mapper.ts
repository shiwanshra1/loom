import type { SpeakerTopicDto } from '@forge-loom/shared-types';
import type { SpeakerTopic } from '@prisma/client';

export function toSpeakerTopicDto(topic: SpeakerTopic): SpeakerTopicDto {
  return {
    id: topic.id,
    title: topic.title,
    description: topic.description ?? undefined,
    status: topic.status,
    scheduledAt: topic.scheduledAt ? topic.scheduledAt.toISOString() : null,
    venue: topic.venue,
    createdAt: topic.createdAt.toISOString(),
  };
}
