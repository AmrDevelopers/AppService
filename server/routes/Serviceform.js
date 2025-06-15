import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

const router = express.Router();

// Configure multer for file uploads
const uploadFolder = path.join(process.cwd(), 'public', 'uploads');
fs.mkdirSync(uploadFolder, { recursive: true });
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadFolder);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '_' + uniqueSuffix + ext);
  },
});
const upload = multer({ storage });

// Helper for database errors
const handleDbError = (res, err) => {
  console.error('Database error:', err);
  return res.status(500).json({ error: 'Database operation failed' });
};

const parseNumber = (value, defaultValue = 0) => {
  const n = Number(value);
  return isNaN(n) ? defaultValue : n;
};

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const baseQuery = `
      SELECT 
        sr.id, sr.report_number, sr.report_date, sr.engineer_name, 
        sr.customer_name, sr.grand_total, sr.created_at
      FROM service_reports sr
      ORDER BY sr.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [serviceReports] = await pool.query(baseQuery, [Number(limit), Number(offset)]);

    const countQuery = 'SELECT COUNT(*) as total FROM service_reports';
    const [countResult] = await pool.query(countQuery);

    res.json({
      data: serviceReports,
      pagination: {
        total: countResult[0].total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    });
  } catch (err) {
    handleDbError(res, err);
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [serviceReport] = await pool.query(
      `
      SELECT 
        sr.*, 
        c.name as customer_name
      FROM service_reports sr
      JOIN customers c ON sr.customer_id = c.id
      WHERE sr.id = ?
      `,
      [id]
    );

    if (serviceReport.length === 0) {
      return res.status(404).json({ error: 'Service report not found' });
    }

    const [equipment] = await pool.query('SELECT * FROM equipment WHERE service_report_id = ?', [id]);

    const equipmentIds = equipment.map((eq) => eq.id);
    let partsUsed = [];
    if (equipmentIds.length > 0) {
      const [parts] = await pool.query('SELECT * FROM parts_used WHERE equipment_id IN (?)', [equipmentIds]);
      partsUsed = parts;
    }

    const [photos] = await pool.query('SELECT photo_url FROM report_photos WHERE service_report_id = ?', [id]);

    res.json({ serviceReport: serviceReport[0], equipment, partsUsed, photos });
  } catch (err) {
    handleDbError(res, err);
  }
});

router.post(
  '/',
  authenticateToken,
  upload.fields([
    { name: 'photos', maxCount: 20 }, // scale photos (multiple)
    { name: 'seal', maxCount: 1 }, // company seal (single)
  ]),
  async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const {
        report_number,
        report_date,
        customer_id,
        engineer_name,
        engineer_signature,
        customer_name,
        customer_signature,
        scales_json,
        service_type, // New field for service type
      } = req.body;

      if (!report_number || !report_date || !customer_id || !engineer_name || !customer_name) {
        await connection.rollback();
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const [existing] = await connection.query('SELECT id FROM service_reports WHERE report_number = ?', [report_number]);
      if (existing.length > 0) {
        await connection.rollback();
        return res.status(409).json({ error: 'Report number already exists' });
      }

      let sealImageUrl = null;
      if (req.files && req.files['seal'] && req.files['seal'][0]) {
        sealImageUrl = `/uploads/${req.files['seal'][0].filename}`;
      }

      let grandTotal = 0;
      let scales = [];
      try {
        scales = JSON.parse(scales_json || '[]');
      } catch {
        await connection.rollback();
        return res.status(400).json({ error: 'Invalid scales JSON' });
      }

      scales.forEach((scale) => {
        if (Array.isArray(scale.parts)) {
          scale.parts.forEach((part) => {
            grandTotal += parseNumber(part.price) * parseNumber(part.quantity, 1);
          });
        }
      });

      const [result] = await connection.query(
        'INSERT INTO service_reports (report_number, report_date, customer_id, engineer_name, engineer_signature, customer_name, customer_signature, seal_image, grand_total, service_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          report_number,
          report_date,
          customer_id,
          engineer_name,
          engineer_signature || null,
          customer_name,
          customer_signature || null,
          sealImageUrl,
          grandTotal,
          JSON.stringify(service_type), // Store service type as JSON
        ]
      );

      const serviceReportId = result.insertId;

      for (const scale of scales) {
        const [eqResult] = await connection.query(
          'INSERT INTO equipment (service_report_id, model, serial_number, department, issue_description) VALUES (?, ?, ?, ?, ?)',
          [serviceReportId, scale.model || '', scale.serialNumber || '', scale.department || '', scale.issue || '']
        );

        const equipmentId = eqResult.insertId;

        if (Array.isArray(scale.parts)) {
          for (const part of scale.parts) {
            await connection.query(
              'INSERT INTO parts_used (equipment_id, name, quantity, price, show_price) VALUES (?, ?, ?, ?, ?)',
              [equipmentId, part.name || '', parseNumber(part.quantity, 1), parseNumber(part.price), false]
            );
          }
        }
      }

      if (req.files && req.files['photos']) {
        for (const file of req.files['photos']) {
          await connection.query('INSERT INTO report_photos (service_report_id, photo_url) VALUES (?, ?)', [
            serviceReportId,
            `/uploads/${file.filename}`,
          ]);
        }
      }

      await connection.commit();

      const [newServiceReport] = await connection.query('SELECT * FROM service_reports WHERE id = ?', [serviceReportId]);

      res.status(201).json(newServiceReport[0]);
    } catch (err) {
      await connection.rollback();
      console.error('Error creating service report:', err);
      res.status(500).json({ error: 'Failed to create service report' });
    } finally {
      connection.release();
    }
  }
);

export default router;
