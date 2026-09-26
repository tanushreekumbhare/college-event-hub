const PDFDocument = require('pdfkit');

/**
 * Generate Certificate PDF stream
 */
const generateCertificatePDF = (res, certificateData) => {
  const { studentName, eventTitle, eventDate, certificateId, organizerName } = certificateData;

  const doc = new PDFDocument({
    layout: 'landscape',
    size: 'A4',
    margin: 40
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Certificate_${certificateId}.pdf`);

  doc.pipe(res);

  // Border & Styling
  doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).lineWidth(3).stroke('#4f46e5');
  doc.rect(26, 26, doc.page.width - 52, doc.page.height - 52).lineWidth(1).stroke('#93c5fd');

  // Title
  doc.fillColor('#1e1b4b').fontSize(32).font('Helvetica-Bold').text('COLLEGE EVENT HUB', 0, 70, { align: 'center' });
  doc.fillColor('#6366f1').fontSize(20).font('Helvetica-Bold').text('CERTIFICATE OF PARTICIPATION', 0, 115, { align: 'center' });

  doc.fillColor('#475569').fontSize(14).font('Helvetica').text('This is proudly presented to', 0, 160, { align: 'center' });
  doc.fillColor('#0f172a').fontSize(26).font('Helvetica-Bold').text(studentName, 0, 195, { align: 'center' });

  doc.fillColor('#475569').fontSize(14).font('Helvetica').text(`for successfully attending and participating in the event`, 0, 240, { align: 'center' });
  doc.fillColor('#4f46e5').fontSize(22).font('Helvetica-Bold').text(`"${eventTitle}"`, 0, 275, { align: 'center' });

  doc.fillColor('#475569').fontSize(12).font('Helvetica').text(`Held on: ${eventDate}`, 0, 320, { align: 'center' });
  doc.fillColor('#475569').fontSize(12).font('Helvetica').text(`Organized by: ${organizerName || 'College Student Activity Council'}`, 0, 340, { align: 'center' });

  // Certificate ID & Footer
  doc.fontSize(10).fillColor('#64748b').text(`Certificate ID: ${certificateId}`, 50, 480);
  doc.fontSize(10).fillColor('#64748b').text(`Verified Cloud Issued Document`, doc.page.width - 250, 480, { align: 'right' });

  doc.end();
};

module.exports = {
  generateCertificatePDF
};
