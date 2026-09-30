import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

export type CertificatePdfInput = {
  certNo: string;
  traineeName: string;
  programmeTitle: string;
  programmeCode: string;
  institutionName: string;
  startDate: Date;
  endDate: Date;
  issuedAt: Date;
  verifyUrl: string;
  photo?: Uint8Array | null;
};

const fmt = (d: Date) => d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const GREEN = rgb(0.075, 0.33, 0.2);
const SAFFRON = rgb(0.96, 0.55, 0.12);

/** A4 landscape certificate with NCCT header, trainee details and a verification QR. */
export async function renderCertificatePdf(i: CertificatePdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Certificate ${i.certNo}`);
  pdf.setAuthor("National Council for Cooperative Training");
  pdf.setCreationDate(i.issuedAt);
  pdf.setModificationDate(i.issuedAt);
  const page = pdf.addPage([842, 595]);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const { width, height } = page.getSize();

  page.drawRectangle({ x: 18, y: 18, width: width - 36, height: height - 36, borderColor: GREEN, borderWidth: 4 });
  page.drawRectangle({ x: 28, y: 28, width: width - 56, height: height - 56, borderColor: SAFFRON, borderWidth: 1 });
  page.drawRectangle({ x: 28, y: height - 110, width: width - 56, height: 82, color: GREEN });

  const center = (text: string, y: number, size: number, font = reg, color = rgb(0.1, 0.1, 0.1)) => {
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - w) / 2, y, size, font, color });
  };
  center("NATIONAL COUNCIL FOR COOPERATIVE TRAINING", height - 62, 20, bold, rgb(1, 1, 1));
  center("Ministry of Cooperation, Government of India  ·  Sahakar Setu", height - 86, 11, reg, rgb(0.9, 0.95, 0.9));

  center("CERTIFICATE OF COMPLETION", height - 160, 26, bold, GREEN);
  center("This is to certify that", height - 200, 13);
  center(i.traineeName, height - 240, 30, bold, rgb(0.05, 0.05, 0.05));
  center("has successfully completed the training programme", height - 272, 13);
  center(`${i.programmeTitle} (${i.programmeCode})`, height - 302, 17, bold, GREEN);
  center(`conducted by ${i.institutionName} from ${fmt(i.startDate)} to ${fmt(i.endDate)}`, height - 330, 12);

  if (i.photo) {
    try {
      const img = await pdf.embedJpg(i.photo).catch(() => pdf.embedPng(i.photo!));
      page.drawImage(img, { x: 60, y: height - 330, width: 90, height: 110 });
    } catch {
      /* photo optional */
    }
  }

  const qrPng = await QRCode.toBuffer(i.verifyUrl, { margin: 1, width: 240 });
  const qr = await pdf.embedPng(qrPng);
  page.drawImage(qr, { x: width - 170, y: 50, width: 120, height: 120 });
  page.drawText("Scan to verify", { x: width - 150, y: 40, size: 9, font: reg });

  page.drawText(`Certificate No: ${i.certNo}`, { x: 60, y: 120, size: 12, font: bold, color: GREEN });
  page.drawText(`Issued on: ${fmt(i.issuedAt)}`, { x: 60, y: 102, size: 11, font: reg });
  page.drawText(`Verify: ${i.verifyUrl}`, { x: 60, y: 84, size: 9, font: reg, color: rgb(0.3, 0.3, 0.3) });
  page.drawLine({ start: { x: 330, y: 90 }, end: { x: 520, y: 90 }, thickness: 1, color: rgb(0.3, 0.3, 0.3) });
  page.drawText("Director, NCCT", { x: 385, y: 74, size: 10, font: reg });

  return pdf.save({ useObjectStreams: false });
}
