import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { inspect } from 'util';

const router = express.Router();

// Get all approved jobs
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [jobs] = await pool.execute(`
      SELECT 
        j.id,
        j.job_number,
        DATE_FORMAT(j.created_at, '%Y-%m-%d') AS date,
        c.name AS customer_name,
        j.status,
        j.scale_make,
        j.scale_model,
        j.scale_serial,
        j.remark,
        q.quotation_number,
        q.amount AS quotation_amount,
        a.lpo_number,
        a.approved_by,
        DATE_FORMAT(a.approval_date, '%Y-%m-%d') AS approval_date,
        i.problems_found AS inspection_problems,
        i.inspected_by,
        DATE_FORMAT(i.inspection_date, '%Y-%m-%d') AS inspection_date
      FROM jobs j
      LEFT JOIN customers c ON j.customer_id = c.id
      LEFT JOIN quotations q ON j.id = q.job_id
      LEFT JOIN approvals a ON j.id = a.job_id
      LEFT JOIN inspections i ON j.id = i.job_id
      WHERE j.status = 'approved'
      ORDER BY j.created_at DESC
    `);

    // Get spare parts for each job
    const jobsWithParts = await Promise.all(jobs.map(async job => {
      const [parts] = await pool.execute(`
        SELECT part_name, quantity, unit_price 
        FROM inspection_spare_parts isp
        JOIN inspections i ON isp.inspection_id = i.id
        WHERE i.job_id = ?
      `, [job.id]);

      return {
        ...job,
        spare_parts: parts
      };
    }));

    res.json({ success: true, data: jobsWithParts });
  } catch (err) {
    console.error('Error fetching approved jobs:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch approved jobs',
      error: err.message 
    });
  }
});

// POST create approval - Final corrected version
router.post('/', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { job_id, lpo_number, approval_date } = req.body;
    const prepared_by = req.user.id; // Get user ID from auth middleware

    // Corrected INSERT query matching your exact table structure
    const [result] = await connection.query(
      `INSERT INTO approvals 
       (job_id, lpo_number, approval_date, prepared_by)
       VALUES (?, ?, ?, ?)`,
      [job_id, lpo_number, approval_date, prepared_by]
    );

    // Update job status to 'approved'
    await connection.query(
      'UPDATE jobs SET status = "approved" WHERE id = ?',
      [job_id]
    );

    await connection.commit();

    // Get the full approval details with user name if needed
    const [approval] = await connection.query(`
      SELECT a.*, u.name as prepared_by_name 
      FROM approvals a
      LEFT JOIN users u ON a.prepared_by = u.id
      WHERE a.id = ?
    `, [result.insertId]);

    res.status(201).json(approval[0]);
  } catch (err) {
    await connection.rollback();
    console.error('Error creating approval:', err);
    res.status(500).json({ error: 'Failed to create approval' });
  } finally {
    connection.release();
  }
});

// Mark job as ready for delivery
router.put('/:id/ready', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const jobId = req.params.id;
    const { prepared_by } = req.body;
    
    // Update job status
    await connection.execute(
      'UPDATE jobs SET status = "ready_for_delivery" WHERE id = ?',
      [jobId]
    );

    // Add delivery record
    await connection.execute(
      'INSERT INTO deliveries (job_id, prepared_by, delivery_date) VALUES (?, ?, CURDATE())',
      [jobId, prepared_by]
    );

    await connection.commit();

    res.json({ 
      success: true,
      message: 'Job marked as ready for delivery'
    });
  } catch (err) {
    await connection.rollback();
    console.error('Error updating job status:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update job status',
      error: err.message 
    });
  } finally {
    connection.release();
  }
});

// PUT /api/approvals/:id - Update approval record
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  // Safely destructure and replace undefined with null
  const lpoNumber = req.body.lpoNumber ?? null;
  const approvedBy = req.body.approvedBy ?? null;
  const approvalDate = req.body.approvalDate ?? null;
  const notes = req.body.notes ?? null;

  try {
    const [result] = await pool.execute(
      `UPDATE approvals 
       SET lpo_number = ?, 
           approved_by = ?, 
           approval_date = ?, 
           notes = ?
       WHERE id = ?`,
      [lpoNumber, approvedBy, approvalDate, notes, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Approval record not found' });
    }

    res.json({ success: true, message: 'Approval updated successfully' });
  } catch (err) {
    console.error('Error updating approval:', err);
    res.status(500).json({ success: false, message: 'Failed to update approval', error: err.message });
  }
});


export default router;