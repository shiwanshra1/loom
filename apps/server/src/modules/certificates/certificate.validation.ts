import { z } from 'zod';

export const issueCertificateSchema = z.object({
  issuingBody: z.string().min(1).optional(),
});

export type IssueCertificateInput = z.infer<typeof issueCertificateSchema>;
