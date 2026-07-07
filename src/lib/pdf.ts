import jsPDF from 'jspdf';

export function downloadPdf(title: string, sections: { heading?: string; content: string }[]) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(title, margin, y);
  y += 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text(`МебПортал — ${new Date().toLocaleDateString('ru-RU')}`, margin, y);
  y += 10;

  doc.setDrawColor(234, 126, 46);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setTextColor(0);

  for (const section of sections) {
    if (y > 270) {
      doc.addPage();
      y = margin;
    }

    if (section.heading) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(section.heading, margin, y);
      y += 8;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    const lines = doc.splitTextToSize(section.content, maxWidth);
    for (const line of lines) {
      if (y > 280) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 6;
    }
    y += 4;
  }

  doc.setFontSize(8);
  doc.setTextColor(150);
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Стр. ${i} из ${pageCount} — mebportal.online`, pageWidth / 2, 290, { align: 'center' });
  }

  doc.save(`${title.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}.pdf`);
}
