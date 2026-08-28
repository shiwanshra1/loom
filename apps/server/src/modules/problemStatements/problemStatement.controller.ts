import type { Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError.js';
import { createProblemStatementSchema } from './problemStatement.validation.js';
import * as problemStatementService from './problemStatement.service.js';
import { toProblemStatementDto } from './problemStatement.mapper.js';

function requireUser(req: Request) {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated');
  }
  return req.user;
}

function requireParam(req: Request, name: string): string {
  const value = req.params[name];
  if (!value) {
    throw new ApiError(400, `Missing required parameter: ${name}`);
  }
  return value;
}

export async function create(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = createProblemStatementSchema.parse(req.body);
  const problemStatement = await problemStatementService.createProblemStatement(user.userId, input);
  res.status(201).json({
    problemStatement: toProblemStatementDto({
      problemStatement,
      bookmarked: false,
      isMine: false,
      interested: false,
    }),
  });
}

export async function list(req: Request, res: Response): Promise<void> {
  const rows = await problemStatementService.listProblemStatements(req.user);
  res.json({ problemStatements: rows.map(toProblemStatementDto) });
}

export async function interest(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  await problemStatementService.expressInterest(user.userId, requireParam(req, 'id'));
  res.status(204).send();
}

export async function bookmark(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const bookmarked = await problemStatementService.toggleBookmark(
    user.userId,
    requireParam(req, 'id')
  );
  res.json({ bookmarked });
}
