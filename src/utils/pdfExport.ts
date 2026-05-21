import type { Vehicle, MaintenanceRecord } from '../models';
import { formatDate, formatOdometer, formatCurrency } from './formatters';

const PAGE_W = 210;  // A4 mm
const PAGE_H = 297;
const MARGIN = 14;
const COL_THUMB = 22;  // thumbnail column width
const COL_COST = 28;   // cost column width
const COL_INFO = PAGE_W - MARGIN * 2 - COL_THUMB - COL_COST - 8; // remaining

async function shareOrDownload(blob: Blob, fileName: string): Promise<void> {
  const file = new File([blob], fileName, { type: 'application/pdf' });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: fileName });
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export async function exportServiceHistoryPDF(
  vehicle: Vehicle,
  records: MaintenanceRecord[],
): Promise<void> {
  const { default: jsPDF } = await import('jspdf');

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const sorted = [...records].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const totalSpend = sorted.reduce((s, r) => s + r.totalCost, 0);

  const drawHeader = (pageNum: number, totalPages: number) => {
    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(20, 20, 20);
    doc.text(`${vehicle.year} ${vehicle.make} ${vehicle.model}`, MARGIN, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const sub: string[] = [];
    if (vehicle.trim) sub.push(vehicle.trim);
    if (vehicle.vin) sub.push(`VIN: ${vehicle.vin}`);
    sub.push(`Generated ${formatDate(new Date())}`);
    doc.text(sub.join('  ·  '), MARGIN, 24);

    // Page number
    doc.text(`Page ${pageNum} of ${totalPages}`, PAGE_W - MARGIN, 24, { align: 'right' });

    // Divider
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, 27, PAGE_W - MARGIN, 27);
  };

  const drawColumnHeaders = (y: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(130, 130, 130);
    doc.text('REC', MARGIN + 1, y);
    doc.text('SERVICE', MARGIN + COL_THUMB + 4, y);
    doc.text('TOTAL', PAGE_W - MARGIN, y, { align: 'right' });
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, y + 2, PAGE_W - MARGIN, y + 2);
  };

  // --- First pass: count pages ---
  // Row height: 14mm if has thumb image, 10mm otherwise
  const ROW_H_IMG = 14;
  const ROW_H = 10;
  const CONTENT_START = 32;
  const COL_HEADER_H = 7;
  const FOOTER_H = 14;
  const CONTENT_H = PAGE_H - CONTENT_START - COL_HEADER_H - FOOTER_H;

  let totalPages = 1;
  let rowY = 0;
  for (const r of sorted) {
    const h = (r.receiptImage && r.receiptImage.startsWith('data:image')) ? ROW_H_IMG : ROW_H;
    if (rowY + h > CONTENT_H) { totalPages++; rowY = 0; }
    rowY += h;
  }

  // --- Second pass: render ---
  let page = 1;
  drawHeader(page, totalPages);
  let y = CONTENT_START + COL_HEADER_H;
  drawColumnHeaders(CONTENT_START);

  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i];
    const hasThumb = r.receiptImage?.startsWith('data:image');
    const rowH = hasThumb ? ROW_H_IMG : ROW_H;

    if (y + rowH > PAGE_H - FOOTER_H) {
      doc.addPage();
      page++;
      drawHeader(page, totalPages);
      y = CONTENT_START + COL_HEADER_H;
      drawColumnHeaders(CONTENT_START);
    }

    // Thumbnail
    if (hasThumb) {
      try {
        const thumbSize = ROW_H_IMG - 2;
        doc.addImage(r.receiptImage!, 'JPEG', MARGIN, y + 1, thumbSize, thumbSize);
      } catch { /* skip bad image */ }
    } else if (r.receiptImage?.startsWith('data:application/pdf')) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(0, 122, 255);
      doc.text('PDF', MARGIN + 3, y + 6);
      doc.setDrawColor(0, 122, 255);
      doc.roundedRect(MARGIN + 0.5, y + 1, 12, 8, 1, 1);
    }

    // Info column
    const infoX = MARGIN + COL_THUMB + 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(20, 20, 20);
    const titleLines = doc.splitTextToSize(r.title, COL_INFO);
    doc.text(titleLines[0], infoX, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    const subParts = [formatDate(r.date), formatOdometer(r.odometer)];
    if (r.shop) subParts.push(r.shop);
    doc.text(subParts.join(' · '), infoX, y + 8.5);

    // Cost
    if (r.totalCost > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(20, 20, 20);
      doc.text(formatCurrency(r.totalCost), PAGE_W - MARGIN, y + 4.5, { align: 'right' });
    }

    // Row separator
    doc.setDrawColor(235, 235, 235);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, y + rowH, PAGE_W - MARGIN, y + rowH);

    y += rowH;
  }

  // Footer on last page
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, PAGE_H - FOOTER_H, PAGE_W - MARGIN, PAGE_H - FOOTER_H);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `${sorted.length} record${sorted.length !== 1 ? 's' : ''}  ·  Total spend: ${formatCurrency(totalSpend)}`,
    MARGIN,
    PAGE_H - FOOTER_H + 5,
  );
  doc.setFontSize(7);
  doc.text('Generated by MotoTrack', PAGE_W - MARGIN, PAGE_H - FOOTER_H + 5, { align: 'right' });

  // Share / download
  const pdfBlob = new Blob([doc.output('arraybuffer')], { type: 'application/pdf' });
  const safeName = `${vehicle.make}-${vehicle.model}-service-history.pdf`
    .toLowerCase()
    .replace(/\s+/g, '-');
  await shareOrDownload(pdfBlob, safeName);
}
