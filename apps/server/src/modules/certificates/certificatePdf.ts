import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';

export interface CertificatePdfParams {
  studentName: string;
  courseTitle: string;
  issuingBody: string;
  issuedAt: Date;
  verifyUrl: string;
}

// Isolated so the layout can change without touching the issuance flow
// around it — same seam pattern as the payment/session integrations.
export async function generateCertificatePdf(params: CertificatePdfParams): Promise<Buffer> {
  const qrPngBuffer = await QRCode.toBuffer(params.verifyUrl, { width: 200 });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(28).text('Certificate of Completion', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(16).text('This certifies that', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(24).text(params.studentName, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(16).text('has successfully completed', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(22).text(params.courseTitle, { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(12).text(`Issued by ${params.issuingBody} on ${params.issuedAt.toDateString()}`, {
      align: 'center',
    });

    doc.image(qrPngBuffer, doc.page.width - 200, doc.page.height - 200, { width: 120 });
    doc.fontSize(10).text('Scan to verify', doc.page.width - 200, doc.page.height - 70, {
      width: 120,
      align: 'center',
    });

    doc.end();
  });
}
