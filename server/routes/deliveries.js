import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route GET /api/jobs?status=ready_for_delivery
 * @desc Get all jobs ready for delivery
 * @access Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const status = req.query.status || 'ready_for_delivery';
    
    const [jobs] = await pool.execute(`
      SELECT 
        j.id,
        j.job_number,
        DATE_FORMAT(j.created_at, '%Y-%m-%d') AS date,
        c.name AS customer_name,
        c.phone_number AS customer_phone,
        j.status,
        j.scale_make,
        j.scale_model,
        j.scale_serial,
        j.remark,
        j.lpo_number,
        q.quotation_number,
        q.amount AS quotation_amount,
        a.approved_by,
        DATE_FORMAT(a.approval_date, '%Y-%m-%d') AS approval_date,
        i.problems_found AS inspection_problems,
        i.inspected_by,
        DATE_FORMAT(i.inspection_date, '%Y-%m-%d') AS inspection_date,
        i.total_cost AS inspection_total_cost,
        d.invoice_number,
        d.invoice_amount,
        DATE_FORMAT(d.invoice_date, '%Y-%m-%d') AS invoice_date,
        d.delivered_by,
        DATE_FORMAT(d.delivery_date, '%Y-%m-%d') AS delivery_date
      FROM jobs j
      LEFT JOIN customers c ON j.customer_id = c.id
      LEFT JOIN quotations q ON j.id = q.job_id
      LEFT JOIN approvals a ON j.id = a.job_id
      LEFT JOIN inspections i ON j.id = i.job_id
      LEFT JOIN deliveries d ON j.id = d.job_id
      WHERE j.status = ?
      ORDER BY j.created_at DESC
    `, [status]);

    // Get spare parts for each job
    const jobsWithParts = await Promise.all(jobs.map(async job => {
      const [parts] = await pool.execute(`
        SELECT 
          id,
          part_name, 
          quantity, 
          unit_price
        FROM inspection_spare_parts
        WHERE inspection_id IN (
          SELECT id FROM inspections WHERE job_id = ?
        )
      `, [job.id]);

      return {
        ...job,
        spare_parts: parts || []
      };
    }));

    res.status(200).json({
      success: true,
      data: jobsWithParts
    });

  } catch (err) {
    console.error('Error fetching ready for delivery jobs:', {
      message: err.message,
      stack: err.stack,
      sql: err.sql
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ready for delivery jobs',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * @route GET /api/jobs/:id
 * @desc Get single job details
 * @access Private
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const jobId = req.params.id;
    
    const [job] = await pool.execute(`
      SELECT 
        j.*,
        c.name AS customer_name,
        c.phone_number AS customer_phone,
        c.email AS customer_email
      FROM jobs j
      LEFT JOIN customers c ON j.customer_id = c.id
      WHERE j.id = ?
    `, [jobId]);

    if (job.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.status(200).json({
      success: true,
      data: job[0]
    });

  } catch (err) {
    console.error('Error fetching job details:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job details'
    });
  }
});

/**
 * @route PUT /api/jobs/:id/delivery
 * @desc Update job delivery details
 * @access Private
 */
router.put('/:id/delivery', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const jobId = req.params.id;
    const { 
      invoice_number, 
      invoice_amount, 
      invoice_date,
      delivered_by,
      delivery_date,
      status
    } = req.body;

    // Validate required fields
    if (!invoice_number || !invoice_amount || !invoice_date || !delivered_by || !delivery_date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if job exists
    const [job] = await connection.execute(
      `SELECT id FROM jobs WHERE id = ?`,
      [jobId]
    );

    if (job.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Update or create delivery record
    await connection.execute(
      `INSERT INTO deliveries (
        job_id, 
        invoice_number, 
        invoice_amount, 
        invoice_date,
        delivered_by,
        delivery_date
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        invoice_number = VALUES(invoice_number),
        invoice_amount = VALUES(invoice_amount),
        invoice_date = VALUES(invoice_date),
        delivered_by = VALUES(delivered_by),
        delivery_date = VALUES(delivery_date)`,
      [jobId, invoice_number, invoice_amount, invoice_date, delivered_by, delivery_date]
    );

    // Update job status if provided
    if (status) {
      await connection.execute(
        'UPDATE jobs SET status = ? WHERE id = ?',
        [status, jobId]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Delivery details updated successfully'
    });

  } catch (err) {
    await connection.rollback();
    console.error('Error updating delivery:', {
      error: err.message,
      jobId: req.params.id,
      body: req.body
    });
    res.status(500).json({
      success: false,
      message: 'Failed to update delivery details',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  } finally {
    connection.release();
  }
});

/**
 * @route GET /api/quotations
 * @desc Get quotations for a job
 * @access Private
 */
router.get('/quotations', authenticateToken, async (req, res) => {
  try {
    const jobId = req.query.job_id;
    
    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: 'Job ID is required'
      });
    }

    const [quotations] = await pool.execute(`
      SELECT * FROM quotations 
      WHERE job_id = ?
      ORDER BY created_at DESC
    `, [jobId]);

    res.status(200).json({
      success: true,
      data: quotations
    });

  } catch (err) {
    console.error('Error fetching quotations:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quotations'
    });
  }
});

/**
 * @route GET /api/inspections
 * @desc Get inspections for a job
 * @access Private
 */
router.get('/jobs/inspections', authenticateToken, async (req, res) => {
  try {
    const jobId = req.query.job_id;
    
    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: 'Job ID is required'
      });
    }

    const [inspections] = await pool.execute(`
      SELECT * FROM inspections 
      WHERE job_id = ?
      ORDER BY inspection_date DESC
    `, [jobId]);

    res.status(200).json({
      success: true,
      data: inspections.length > 0 ? inspections[0] : null
    });

  } catch (err) {
    console.error('Error fetching inspections:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inspections'
    });
  }
});

/**
 * @route GET /api/inspections/:id/spare-parts
 * @desc Get spare parts for an inspection
 * @access Private
 */
router.get('/inspections/:id/spare-parts', authenticateToken, async (req, res) => {
  try {
    const inspectionId = req.params.id;
    
    const [parts] = await pool.execute(`
      SELECT * FROM inspection_spare_parts
      WHERE inspection_id = ?
      ORDER BY part_name
    `, [inspectionId]);

    res.status(200).json({
      success: true,
      data: parts
    });

  } catch (err) {
    console.error('Error fetching spare parts:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch spare parts'
    });
  }
});

export default router;