export interface CertificateDto {
  id: string;
  courseTitle: string;
  issuingBody: string;
  token: string;
  issuedAt: string;
  verifyUrl: string;
  downloadUrl: string;
}

// Deliberately minimal — a public, unauthenticated, rate-limited endpoint
// must never leak more than confirmation data (architecture doc §8.3).
export interface CertificateVerificationDto {
  valid: boolean;
  studentName?: string;
  courseTitle?: string;
  issuingBody?: string;
  issuedAt?: string;
}
