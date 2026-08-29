import type { Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError.js';
import { issueCertificateSchema } from './certificate.validation.js';
import * as certificateService from './certificate.service.js';
import { toCertificateDto } from './certificate.mapper.js';

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

export async function issue(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = issueCertificateSchema.parse(req.body);
  const certificate = await certificateService.issueCertificate(
    requireParam(req, 'id'),
    user,
    input
  );
  res.status(201).json({ certificate: await toCertificateDto(certificate) });
}

export async function listMine(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const certificates = await certificateService.listMyCertificates(user.userId);
  res.json({ certificates: await Promise.all(certificates.map(toCertificateDto)) });
}

export async function verify(req: Request, res: Response): Promise<void> {
  const result = await certificateService.verifyCertificate(requireParam(req, 'token'));
  res.json({
    valid: result.valid,
    studentName: result.studentName,
    courseTitle: result.courseTitle,
    issuingBody: result.issuingBody,
    issuedAt: result.issuedAt?.toISOString(),
  });
}
