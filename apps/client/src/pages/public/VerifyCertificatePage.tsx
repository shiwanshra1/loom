import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import type { CertificateVerificationDto } from '@forge-loom/shared-types';
import { apiRequest } from '../../lib/apiClient';
import { Card } from '../../components/ui/Card';
import { PageLoading } from '../../components/ui/PageLoading';

export function VerifyCertificatePage() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ['verify-certificate', token],
    queryFn: () => apiRequest<CertificateVerificationDto>(`/api/certificates/verify/${token}`),
    enabled: Boolean(token),
    retry: false,
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <Card className="w-full max-w-md text-center">
        <div className="mb-4 flex items-center justify-center gap-1">
          <span className="text-xl font-bold text-blue-600">FORGE</span>
          <span className="text-sm text-slate-400">LMS</span>
        </div>

        {isLoading ? (
          <PageLoading />
        ) : data?.valid ? (
          <>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
              <CheckCircle2 size={28} />
            </div>
            <h1 className="mb-1 text-lg font-semibold text-slate-900">Certificate Verified</h1>
            <p className="mb-4 text-sm text-slate-500">
              This certificate is genuine and was issued by Forge Loom.
            </p>
            <div className="rounded-xl border border-slate-200 p-4 text-left text-sm">
              <div className="mb-2 flex justify-between">
                <span className="text-slate-500">Student</span>
                <span className="font-medium text-slate-900">{data.studentName}</span>
              </div>
              <div className="mb-2 flex justify-between">
                <span className="text-slate-500">Course</span>
                <span className="font-medium text-slate-900">{data.courseTitle}</span>
              </div>
              <div className="mb-2 flex justify-between">
                <span className="text-slate-500">Issued By</span>
                <span className="font-medium text-slate-900">{data.issuingBody}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Issued On</span>
                <span className="font-medium text-slate-900">
                  {data.issuedAt ? new Date(data.issuedAt).toLocaleDateString() : ''}
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
              <ShieldAlert size={28} />
            </div>
            <h1 className="mb-1 text-lg font-semibold text-slate-900">Certificate Not Found</h1>
            <p className="text-sm text-slate-500">
              This verification link is invalid or the certificate doesn&apos;t exist.
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
