import type { CertificateDto } from '@forge-loom/shared-types';
import type { Certificate } from '@prisma/client';
import { env } from '../../config/env.js';
import { getCertificateDownloadUrl } from './certificate.service.js';

export async function toCertificateDto(certificate: Certificate): Promise<CertificateDto> {
  return {
    id: certificate.id,
    courseTitle: certificate.courseTitle,
    issuingBody: certificate.issuingBody,
    token: certificate.token,
    issuedAt: certificate.issuedAt.toISOString(),
    verifyUrl: `${env.publicAppUrl}/verify/${certificate.token}`,
    downloadUrl: await getCertificateDownloadUrl(certificate),
  };
}
