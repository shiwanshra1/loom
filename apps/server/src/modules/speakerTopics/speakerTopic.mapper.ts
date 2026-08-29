import type { SpeakerTopicDto } from '@forge-loom/shared-types';
import type { SpeakerTopicDocument } from '../../models/SpeakerTopic.js';

export function toSpeakerTopicDto(topic: SpeakerTopicDocument): SpeakerTopicDto {
  return {
    id: topic._id.toString(),
    title: topic.title,
    description: topic.description,
    status: topic.status,
    scheduledAt: topic.scheduledAt ? topic.scheduledAt.toISOString() : null,
    venue: topic.venue,
    createdAt: topic.createdAt.toISOString(),
  };
}
