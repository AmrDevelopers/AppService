import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all invoices
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [invoices] = await pool.execute(`
      SELECT i.*, j.job_number, c.name as customer_name
      FROM invoices i
      JOIN jobs j ON i.job_id = j.id
      JOIN customers c ON j.customer_id = c.id
    `);
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new invoice
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { jobId, invoiceNumber, invoiceDate, amount } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO invoices (job_id, invoice_number, invoice_date, amount) VALUES (?, ?, ?, ?)',
      [jobId, invoiceNumber, invoiceDate, amount]
    );

    // Update job status
    await pool.execute(
      'UPDATE jobs SET status = ? WHERE id = ?',
      ['COMPLETED', jobId]
    );

    res.status(201).json({
      id: result.insertId,
      job_id: jobId,
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      amount
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;