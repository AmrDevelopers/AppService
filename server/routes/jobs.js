import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Status constants
const JOB_STATUS = {
  PENDING_INSPECTION: 'pending_inspection',
  PENDING_QUOTATION: 'pending_quotation',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  READY_FOR_DELIVERY: 'ready_for_delivery',
  DELIVERED: 'delivered'
};

// ───────────────────────────────────────────────
// Create New Job
// ───────────────────────────────────────────────
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      customer_id,
      taken_by,
      remark,
      make,
      model,
      serial_number
    } = req.body;

    if (!customer_id || !taken_by) {
      return res.status(400).json({
        success: false,
        message: 'Customer and Taken By are required.'
      });
    }

    const now = new Date();
    const jobNumber = `JB${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${Math.floor(1000 + Math.random() * 9000)}`;

    const [result] = await pool.execute(
      `INSERT INTO jobs 
        (job_number, customer_id, taken_by, remark, scale_make, scale_model, scale_serial, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        jobNumber,
        customer_id,
        taken_by,
        remark ?? null,
        make ?? null,
        model ?? null,
        serial_number ?? null,
        JOB_STATUS.PENDING_INSPECTION
      ]
    );

    res.status(201).json({
      success: true,
      jobId: result.insertId,
      jobNumber,
      status: JOB_STATUS.PENDING_INSPECTION
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({
      success: false,
      message: 'Job creation failed',
      error: error.message
    });
  }
});

// ───────────────────────────────────────────────
// Get Jobs (optionally filtered by status)
// ───────────────────────────────────────────────
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT j.*, c.name AS customer_name, c.contact_person, c.phone, c.email
      FROM jobs j
      JOIN customers c ON j.customer_id = c.id
    `;
    const params = [];

    if (status) {
      query += ' WHERE j.status = ?';
      params.push(status);
    }

    query += ' ORDER BY j.created_at DESC';

    const [jobs] = await pool.execute(query, params);

    res.json({
      success: true,
      data: jobs,
      count: jobs.length
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs',
      error: error.message
    });
  }
});

// ───────────────────────────────────────────────
// ✅ New Route: Get Jobs Pending Inspection
// ───────────────────────────────────────────────
router.get('/inspections', authenticateToken, async (req, res) => {
  const { job_id } = req.query;

  try {
    if (job_id) {
      // Fetch inspection by job_id
      const [inspection] = await pool.execute(`
        SELECT i.*
        FROM inspections i
        WHERE i.job_id = ?
        LIMIT 1
      `, [job_id]);

      if (inspection.length === 0) {
        return res.status(404).json({ success: false, message: 'Inspection not found for this job' });
      }

      return res.json(inspection[0]); // return single inspection object ✅
    }

    // If no job_id: return all jobs pending inspection
    const [jobs] = await pool.execute(`
      SELECT j.*, c.name AS customer_name, c.contact_person, c.phone, c.email
      FROM jobs j
      JOIN customers c ON j.customer_id = c.id
      WHERE j.status = ?
      ORDER BY j.created_at DESC
    `, [JOB_STATUS.PENDING_INSPECTION]);

    res.json({
      success: true,
      data: jobs,
      count: jobs.length
    });

  } catch (error) {
    console.error('Error fetching inspection jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inspection jobs',
      error: error.message
    });
  }
});

// GET /api/jobs/:id - Fetch single job by ID
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const [jobs] = await pool.query(`
      SELECT j.*, c.name AS customer_name, c.phone AS customer_phone, c.contact_person
      FROM jobs j
      JOIN customers c ON j.customer_id = c.id
      WHERE j.id = ?
    `, [id]);

    if (jobs.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(jobs[0]);
  } catch (err) {
    console.error('Error fetching job details:', err);
    res.status(500).json({ error: 'Failed to fetch job details' });
  }
});

// GET /api/jobs/inspections/:inspection_id/spare-parts - Get spare parts for a specific inspection
router.get('/inspections/:inspection_id/spare-parts', authenticateToken, async (req, res) => {
  const { inspection_id } = req.params;

  try {
    const [spareParts] = await pool.query(`
      SELECT * 
      FROM inspection_spare_parts 
      WHERE inspection_id = ?
    `, [inspection_id]);

    if (spareParts.length === 0) {
      return res.status(404).json({ error: 'No spare parts found for this inspection' });
    }

    res.json({
      success: true,
      data: spareParts
    });
  } catch (err) {
    console.error('Error fetching spare parts for inspection:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch spare parts',
      error: err.message
    });
  }
});

// ───────────────────────────────────────────────
// Approve Job with LPO
// ───────────────────────────────────────────────
router.patch('/jobs/:id/approve', authenticateToken, async (req, res) => {
  const jobId = req.params.id;
  const { lpo_number } = req.body;

  try {
    await pool.execute(
      'UPDATE jobs SET status = ?, lpo_number = ? WHERE id = ?',
      ['approved', lpo_number, jobId]
    );

    res.json({ success: true, message: 'Job approved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to approve job', error: err.message });
  }
});

// ───────────────────────────────────────────────
// Mark Job as Delivered
// ───────────────────────────────────────────────
router.patch('/:id/deliver', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { delivery_date, delivered_by } = req.body;

    const [result] = await pool.execute(
      'UPDATE jobs SET status = ?, delivery_date = ?, delivered_by = ? WHERE id = ?',
      [JOB_STATUS.DELIVERED, delivery_date ?? null, delivered_by ?? null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.json({
      success: true,
      message: 'Job marked as delivered successfully'
    });
  } catch (error) {
    console.error('Error marking job as delivered:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark job as delivered',
      error: error.message
    });
  }
});

router.patch('/:id/status', authenticateToken, async (req, res) => {
  const jobId = req.params.id;
  const { status } = req.body;

  try {
    await pool.execute('UPDATE jobs SET status = ? WHERE id = ?', [status, jobId]);
    res.json({ success: true, message: 'Job status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update job status', error: err.message });
  }
});

// PUT /api/jobs/:id - Update only remark, make, model, serial
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { remark, scale_make, scale_model, scale_serial } = req.body;

  try {
    const [result] = await pool.execute(
      `UPDATE jobs 
       SET remark = ?, 
           scale_make = ?, 
           scale_model = ?, 
           scale_serial = ?
       WHERE id = ?`,
      [
        remark ?? null,
        scale_make ?? null,
        scale_model ?? null,
        scale_serial ?? null,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    res.json({ success: true, message: 'Job updated successfully' });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update job',
      error: error.message
    });
  }
});

export default router;
