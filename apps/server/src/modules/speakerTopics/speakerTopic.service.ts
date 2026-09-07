import type { SpeakerTopic } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import type { CreateSpeakerTopicInput } from './speakerTopic.validation.js';

export async function createTopic(
  speakerId: string,
  input: CreateSpeakerTopicInput
): Promise<SpeakerTopic> {
  return prisma.speakerTopic.create({
    data: { speakerId, title: input.title, description: input.description },
  });
}

export async function listMyTopics(speakerId: string): Promise<SpeakerTopic[]> {
  return prisma.speakerTopic.findMany({ where: { speakerId }, orderBy: { createdAt: 'desc' } });
}
