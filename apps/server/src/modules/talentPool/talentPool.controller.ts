import type { Request, Response } from 'express';
import { searchTalentPoolSchema } from './talentPool.validation.js';
import * as talentPoolService from './talentPool.service.js';
import { toTalentSearchPageDto } from './talentPool.mapper.js';

export async function search(req: Request, res: Response): Promise<void> {
  const input = searchTalentPoolSchema.parse(req.query);
  const result = await talentPoolService.searchTalentPool(input);
  res.json(await toTalentSearchPageDto(result));
}
