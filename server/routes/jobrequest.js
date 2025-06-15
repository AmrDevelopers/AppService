
import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Enhanced GET all job requests with pagination and filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, dateFrom, dateTo } = req.query;
    const offset = (page - 1) * limit;

    let baseQuery = `
      SELECT jr.*, c.name AS customer_name
      FROM job_requests jr
      JOIN customers c ON jr.customer_id = c.id
    `;
    const queryParams = [];
    const whereClauses = [];

    // Add search filter
    if (search) {
      whereClauses.push(`
        (jr.job_number LIKE ? OR c.name LIKE ? OR jr.job_type LIKE ?)\
      `);
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Add date range filter
    if (dateFrom) {
      whereClauses.push('jr.date >= ?');
      queryParams.push(dateFrom);
    }
    if (dateTo) {
      whereClauses.push('jr.date <= ?');
      queryParams.push(dateTo);
    }

    // Build WHERE clause if filters exist
    if (whereClauses.length > 0) {
      baseQuery += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    // Add sorting and pagination
    baseQuery += `
      ORDER BY jr.date DESC, jr.job_number DESC
      LIMIT ? OFFSET ?
    `;
    queryParams.push(Number(limit), Number(offset));

    // Execute query
    const [jobs] = await pool.query(baseQuery, queryParams);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM job_requests jr
      JOIN customers c ON jr.customer_id = c.id
    `;
    if (whereClauses.length > 0) {
      countQuery += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    const [totalResult] = await pool.query(countQuery, queryParams.slice(0, -2));
    const total = totalResult[0].total;

    res.json({
      success: true,
      data: jobs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching job requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job requests'
    });
  }
});

// Enhanced job number generation with transaction
router.post('/generate', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { jobType, date, customerId } = req.body;
    const userId = req.user.id;

    // Validate inputs more thoroughly
    if (!jobType || !date || !customerId) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Job type, date, and customer ID are required'
      });
    }

    // Verify customer exists
    const [customer] = await connection.query(
      'SELECT id FROM customers WHERE id = ?',
      [customerId]
    );
    if (!customer.length) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

     // Validate date format
     const jobDate = new Date(date);
     if (isNaN(jobDate.getTime())) {
       await connection.rollback();
       return res.status(400).json({
         success: false,
         message: 'Invalid date format'
       });
     }

    // Get or create sequence for this date
    await connection.query(`
      INSERT INTO job_sequences (sequence_date, job_type, last_sequence)
      VALUES (?, ?, 1)
      ON DUPLICATE KEY UPDATE last_sequence = last_sequence + 1
    `, [date, jobType]);

    // Get the updated sequence
    const [sequenceRows] = await connection.query(
      'SELECT last_sequence FROM job_sequences WHERE sequence_date = ? AND job_type = ?',
      [date, jobType]
    );
    const sequence = sequenceRows[0].last_sequence;

    // Extract year, month, day from the date
    const year = jobDate.getFullYear().toString().slice(-2);
    const month = (jobDate.getMonth() + 1).toString().padStart(2, '0');
    const day = jobDate.getDate().toString().padStart(2, '0');

    // Generate job number - REMOVE DASH
    const typePart = jobType === 'accredited' ? 'A' : ''; // 'A' for accredited, empty for non-accredited
    const jobNumber = `ASC${year}/${typePart}${month}${day}${sequence.toString().padStart(2, '0')}`; // New format
    // Create job request
    await connection.query(`
      INSERT INTO job_requests
      (job_number, date, job_type, customer_id, created_by)
      VALUES (?, ?, ?, ?, ?)\
    `, [jobNumber, date, jobType.toUpperCase(), customerId, userId]);

    await connection.commit();

    // Return the generated job number with full details
    const [newJob] = await pool.query(`
      SELECT jr.*, c.name AS customer_name
      FROM job_requests jr
      JOIN customers c ON jr.customer_id = c.id
      WHERE jr.job_number = ?
    `, [jobNumber]);

    res.json({
      success: true,
      data: newJob[0]
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error generating job number:', error);

    let errorMessage = 'Failed to generate job number';
    if (error.code === 'ER_DUP_ENTRY') {
      errorMessage = 'Job number already exists';
    } else if (error.code === 'ER_NO_REFERENCED_ROW') {
      errorMessage = 'Referenced customer does not exist';
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (connection) connection.release();
  }
});

// Get job request by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [job] = await pool.query(`
      SELECT jr.*, c.name AS customer_name, c.address, c.contact_person, c.phone, c.email
      FROM job_requests jr
      JOIN customers c ON jr.customer_id = c.id
      WHERE jr.id = ?
    `, [id]);

    if (!job.length) {
      return res.status(404).json({
        success: false,
        message: 'Job request not found'
      });
    }

    res.json({
      success: true,
      data: job[0]
    });
  } catch (error) {
    console.error('Error fetching job request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job request'
    });
  }
});

router.get('/', async (req, res) => {  // Remove '/api/jobs' since it's already mounted
  try {
    const [rows] = await connection.query(`
      SELECT 
        jr.id,
        jr.job_number,
        jr.date,
        jr.job_type,
        c.name AS customer_name,
        jr.created_at
      FROM job_requests jr
      LEFT JOIN customers c ON jr.customer_id = c.id
      ORDER BY jr.date DESC
      LIMIT 10
    `);
    
    res.json({
      success: true,
      data: rows  // Match the frontend expected structure
    });
  } catch (err) {
    console.error('Error fetching job history:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch job history' 
    });
  }
});

export default router;
