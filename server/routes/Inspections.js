import express from 'express';
import pool from '../config/database.js'; // Database connection pool
import { authenticateToken } from '../middleware/auth.js'; // Authentication middleware

const router = express.Router();

// GET /api/jobs/inspections - Fetch jobs pending inspection
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM jobs WHERE status = 'pending_inspection' ORDER BY created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch jobs' });
  }
});

// POST /api/jobs/inspections - Submit inspection results
// POST /api/jobs/inspections - Submit inspection results
router.post('/', authenticateToken, async (req, res) => {
  const {
    job_id,
    problems_found,
    inspected_by,
    inspection_date,
    total_cost,
    spare_parts,
    notes,
  } = req.body;

  if (!job_id || !problems_found || !inspected_by || !inspection_date) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const client = await pool.getConnection();
  try {
    await client.beginTransaction();

    // Insert inspection
    const [inspectionResult] = await client.query(
      `INSERT INTO inspections (job_id, problems_found, inspected_by, inspection_date, total_cost, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [job_id, problems_found, inspected_by, inspection_date, total_cost, notes]
    );

    const inspectionId = inspectionResult.insertId;

    // Insert spare parts if any
    if (Array.isArray(spare_parts) && spare_parts.length > 0) {
      for (const part of spare_parts) {
        await client.query(
          `INSERT INTO inspection_spare_parts (inspection_id, part_name, quantity, unit_price)
           VALUES (?, ?, ?, ?)`,
          [inspectionId, part.part_name, part.quantity, part.unit_price]
        );
      }
    }

    // Update job status
    await client.query(
      `UPDATE jobs SET status = 'pending_quotation' WHERE id = ?`,
      [job_id]
    );

    await client.commit();
    res.status(201).json({
      success: true,
      message: 'Inspection submitted successfully',
      data: { inspection_id: inspectionId },
    });
  } catch (error) {
    await client.rollback();
    console.error('Error submitting inspection:', error);
    res.status(500).json({ success: false, message: 'Failed to submit inspection' });
  } finally {
    client.release();
  }
});

export default router;
