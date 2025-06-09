const PDFDocument = require('pdfkit');
const { uploadPdfToS3 } = require('../middlewares/upload');

const streamToBuffer = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });

const generateReceiptPdf = async (donation, user) => {
  const doc = new PDFDocument();

  // Compose the PDF content
  doc.fontSize(20).text('Donation Receipt', { align: 'center' });
  doc.moveDown();

  doc.fontSize(14).text(`Charity Campaign: ${donation.Campaign.campaignTitle}`);
  doc.text(`Donor Name: ${user.name}`);
  doc.text(`Amount: ₹${donation.amount}`);
  doc.text(`Payment ID: ${donation.razorpay_payment_id}`);
  doc.text(`Date: ${new Date(donation.createdAt).toLocaleString()}`);
  doc.moveDown();
  doc.text('Thank you for your generous contribution!');

  doc.end();

  const pdfBuffer = await streamToBuffer(doc);
  const pdfUrl = await uploadPdfToS3(pdfBuffer, `receipt-${donation.id}.pdf`);

  return pdfUrl;
};

module.exports = generateReceiptPdf;
