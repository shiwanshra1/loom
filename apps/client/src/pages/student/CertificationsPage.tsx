import { Download, ExternalLink, GraduationCap } from 'lucide-react';
import { useMyCertificates } from '../../features/student/hooks';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PageLoading } from '../../components/ui/PageLoading';

export function CertificationsPage() {
  const { data: certificates, isLoading } = useMyCertificates();

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Certifications</h1>
      <p className="mb-6 text-sm text-slate-500">
        Certificates earned for completed courses — each one is publicly verifiable.
      </p>

      {(!certificates || certificates.length === 0) && (
        <Card>
          <p className="py-8 text-center text-sm text-slate-400">
            No certificates yet — complete a course and your trainer will issue one.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {certificates?.map((certificate) => (
          <Card key={certificate.id} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <GraduationCap size={20} />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{certificate.courseTitle}</p>
                <p className="text-xs text-slate-500">
                  {certificate.issuingBody} · {new Date(certificate.issuedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <a href={certificate.downloadUrl} target="_blank" rel="noreferrer" className="flex-1">
                <Button variant="secondary" className="w-full">
                  <Download size={14} /> Download PDF
                </Button>
              </a>
              <a href={certificate.verifyUrl} target="_blank" rel="noreferrer" className="flex-1">
                <Button variant="secondary" className="w-full">
                  <ExternalLink size={14} /> Verify
                </Button>
              </a>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
