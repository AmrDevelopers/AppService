import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const router = express.Router();

const A4_WIDTH = 595;
const A4_HEIGHT = 842;
const MARGIN = 40;

const safeNumber = (value) => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

router.get('/jobs/:jobId/service-report', authenticateToken, async (req, res) => {
  const { jobId } = req.params;
  const doc = new PDFDocument({ size: 'A4', margin: MARGIN });

  try {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="service_report_${jobId}.pdf"`);
    doc.pipe(res);

    // Get job data
    const [jobRows] = await pool.query(`
      SELECT j.*, c.name as customer_name, c.phone as customer_phone,
             c.email as customer_email, c.address as customer_address
      FROM jobs j JOIN customers c ON j.customer_id = c.id
      WHERE j.id = ?`, [jobId]);

    if (jobRows.length === 0) {
      doc.text('Job not found').end();
      return;
    }

    const job = jobRows[0];

    const [inspectionRows] = await pool.query(`
      SELECT * FROM inspections WHERE job_id = ?
      ORDER BY inspection_date DESC LIMIT 1`, [jobId]);

    if (inspectionRows.length === 0) {
      doc.text('No inspection data found').end();
      return;
    }

    const inspection = inspectionRows[0];

    const [sparePartsRows] = await pool.query(`
      SELECT * FROM inspection_spare_parts WHERE inspection_id = ?`, [inspection.id]);

    const spareParts = sparePartsRows;

    let totalPartsCost = safeNumber(inspection.total_cost);
    if (totalPartsCost === 0 && spareParts.length > 0) {
      totalPartsCost = spareParts.reduce((sum, part) => {
        return sum + safeNumber(part.quantity) * safeNumber(part.unit_price);
      }, 0);
    }

    const drawSection = (title) => {
      doc.moveDown(1);
      doc.fontSize(13).fillColor('#ffffff')
         .rect(MARGIN, doc.y, A4_WIDTH - 2 * MARGIN, 22).fill('#007bff');
      doc.fillColor('#ffffff').font('Helvetica-Bold')
         .text(`  ${title}`, MARGIN + 5, doc.y + 6);
      doc.moveDown(0.8).fillColor('#000');
    };

    // === FULL HEADER IMAGE ===
const headerImagePath = path.join(process.cwd(), 'public', 'header.jpg'); // full-width header image
const headerTopY = 1;
if (fs.existsSync(headerImagePath)) {
  doc.image(headerImagePath, MARGIN, MARGIN, {
    width: A4_WIDTH - 2 * MARGIN,
    align: 'center'
  });
}

    // === HEADER (Job # and Date same line) ===
    const headerY = MARGIN + 60; // Adjust this as needed based on the header image size
doc.fontSize(11).font('Helvetica')
   .text(`Date: ${new Date(job.created_at).toLocaleDateString()}`, MARGIN, headerY)
   .text(`Job #: ${job.job_number}`, A4_WIDTH - MARGIN - 200, headerY, {
     width: 200,
     align: 'right'
   });
   
   doc.moveDown(2);

    // === CUSTOMER INFORMATION ===
    drawSection('CUSTOMER INFORMATION');
    doc.fontSize(11)
       .text(`Name: ${job.customer_name}`)
       .text(`Email: ${job.customer_email || 'N/A'}`)
       .text(`Phone: ${job.customer_phone || 'N/A'}`)
       .text(`Address: ${job.customer_address || 'N/A'}`);

    // === EQUIPMENT INFORMATION ===
    drawSection('EQUIPMENT INFORMATION');
    doc.fontSize(11).text(
      `Make: ${job.scale_make || 'N/A'} | Model: ${job.scale_model || 'N/A'} | Serial No: ${job.scale_serial || 'N/A'}`
    );

    // === INSPECTION FINDINGS ===
    drawSection('INSPECTION FINDINGS');
    doc.fontSize(11).text(inspection.problems_found || 'No problems found.');

    // === SPARE PARTS USED ===
    drawSection('SPARE PARTS USED');

    if (spareParts.length > 0) {
      const colWidths = [220, 60, 100, 100];
      const headers = ['Part Name', 'Qty', 'Unit Price', 'Total'];
      const x = MARGIN;
      let y = doc.y;

      doc.font('Helvetica-Bold');
      headers.forEach((txt, i) => {
        doc.text(txt, x + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y);
      });

      doc.font('Helvetica');
      y = doc.y + 15;

      spareParts.forEach(part => {
        const qty = safeNumber(part.quantity);
        const price = safeNumber(part.unit_price);
        const total = qty * price;
        const row = [
          part.part_name,
          qty.toString(),
          `AED${price.toFixed(2)}`,
          `AED${total.toFixed(2)}`
        ];
        row.forEach((val, i) => {
          doc.text(val, x + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y);
        });
        y += 18;
        doc.y = y;
      });

      // Total Cost
      doc.moveDown(0.5).font('Helvetica-Bold')
         .text(`Total Parts Cost: AED${totalPartsCost.toFixed(2)}`, MARGIN, doc.y);
    } else {
      doc.text('No spare parts used.');
    }

    // === TECHNICIAN NOTES ===
    if (inspection.notes) {
      drawSection('TECHNICIAN NOTES');
      doc.fontSize(11).text(inspection.notes);
    }

    // === SIGNATURES ===
    drawSection('SIGNATURES');

    const sigWidth = 200;
    const sigY = doc.y + 10;
    const techX = MARGIN;
    const custX = A4_WIDTH - MARGIN - sigWidth;

    doc.moveTo(techX, sigY).lineTo(techX + sigWidth, sigY).stroke();
    doc.fontSize(10).text('Technician Signature', techX, sigY + 5)
       .text(`Name: ${inspection.inspected_by || 'N/A'}`, techX, sigY + 20);

    doc.moveTo(custX, sigY).lineTo(custX + sigWidth, sigY).stroke();
    doc.text('Customer Signature', custX, sigY + 5)
       .text(`Name: ${job.customer_name || 'N/A'}`, custX, sigY + 20);

    doc.end();
  } catch (err) {
    console.error('Error generating PDF:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate report.' });
    }
  }
});

export default router;
