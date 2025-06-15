import express from 'express';
import pool from '../config/database.js'; // MySQL connection pool
import { authenticateToken } from '../middleware/auth.js'; // Token authentication middleware

const router = express.Router();

// Endpoint to get dashboard statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const [results] = await pool.execute(`
      SELECT 
        status, 
        COUNT(*) AS count
      FROM jobs
      WHERE status IN ('pending_inspection', 'pending_quotation', 'pending_approval', 'approved', 'ready_for_delivery', 'completed', 'cancelled')
      GROUP BY status
    `);
    
    // Convert results to an object where status is the key
    const stats = results.reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, {});

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error.message
    });
  }
});

// Endpoint to fetch jobs based on status
router.get('/jobs', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query; // Get the status from the query params

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status query parameter is required.'
      });
    }

    const [results] = await pool.execute(`
  SELECT 
    jobs.id, 
    jobs.job_number, 
    jobs.status, 
    jobs.created_at, 
    customers.name AS customer_name
  FROM jobs
  JOIN customers ON jobs.customer_id = customers.id
  WHERE jobs.status = ?
`, [status]);

    res.json({
      success: true,
      data: results
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

export default router;
