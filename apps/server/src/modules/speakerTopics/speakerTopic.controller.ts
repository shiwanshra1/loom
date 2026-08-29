import type { Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError.js';
import { createSpeakerTopicSchema } from './speakerTopic.validation.js';
import * as speakerTopicService from './speakerTopic.service.js';
import { toSpeakerTopicDto } from './speakerTopic.mapper.js';

function requireUser(req: Request) {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated');
  }
  return req.user;
}

export async function create(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = createSpeakerTopicSchema.parse(req.body);
  const topic = await speakerTopicService.createTopic(user.userId, input);
  res.status(201).json({ topic: toSpeakerTopicDto(topic) });
}

export async function listMine(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const topics = await speakerTopicService.listMyTopics(user.userId);
  res.json({ topics: topics.map(toSpeakerTopicDto) });
}
