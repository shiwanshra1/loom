import { SpeakerTopicModel, type SpeakerTopicDocument } from '../../models/SpeakerTopic.js';
import type { CreateSpeakerTopicInput } from './speakerTopic.validation.js';

export async function createTopic(
  speakerId: string,
  input: CreateSpeakerTopicInput
): Promise<SpeakerTopicDocument> {
  return SpeakerTopicModel.create({
    speakerId,
    title: input.title,
    description: input.description,
  });
}

export async function listMyTopics(speakerId: string): Promise<SpeakerTopicDocument[]> {
  return SpeakerTopicModel.find({ speakerId }).sort({ createdAt: -1 });
}
