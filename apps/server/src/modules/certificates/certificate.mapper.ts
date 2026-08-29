import type { CertificateDto } from '@forge-loom/shared-types';
import { env } from '../../config/env.js';
import type { CertificateDocument } from '../../models/Certificate.js';
import { getCertificateDownloadUrl } from './certificate.service.js';

export async function toCertificateDto(certificate: CertificateDocument): Promise<CertificateDto> {
  return {
    id: certificate._id.toString(),
    courseTitle: certificate.courseTitle,
    issuingBody: certificate.issuingBody,
    token: certificate.token,
    issuedAt: certificate.issuedAt.toISOString(),
    verifyUrl: `${env.publicAppUrl}/verify/${certificate.token}`,
    downloadUrl: await getCertificateDownloadUrl(certificate),
  };
}
