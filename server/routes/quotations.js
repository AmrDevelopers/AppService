import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Helper function to handle database errors
const handleDbError = (res, err) => {
  console.error('Database error:', err);
  return res.status(500).json({ error: 'Database operation failed' });
};

// GET all quotations
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, job_id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let baseQuery = `
      SELECT 
        q.id, q.quotation_number, q.quotation_date, q.amount, q.status,
        j.id as job_id, j.job_number, j.status as job_status,
        c.id as customer_id, c.name as customer_name
      FROM quotations q
      JOIN jobs j ON q.job_id = j.id
      JOIN customers c ON j.customer_id = c.id
    `;

    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('q.status = ?');
      params.push(status);
    }

    if (job_id) {
      conditions.push('q.job_id = ?');
      params.push(job_id);
    }

    if (conditions.length > 0) {
      baseQuery += ' WHERE ' + conditions.join(' AND ');
    }

    const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as count_query`;
    const [countResult] = await pool.query(countQuery, params);

    const dataQuery = baseQuery + ' ORDER BY q.quotation_date DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const [quotations] = await pool.query(dataQuery, params);

    res.json({
      data: quotations,
      pagination: {
        total: countResult[0].total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (err) {
    handleDbError(res, err);
  }
});

// GET single quotation by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [quotation] = await pool.query(`
      SELECT 
        q.*, 
        j.job_number, j.status as job_status, j.scale_make, j.scale_model, j.scale_serial,
        c.name as customer_name, c.phone as customer_phone
      FROM quotations q
      JOIN jobs j ON q.job_id = j.id
      JOIN customers c ON j.customer_id = c.id
      WHERE q.id = ?
    `, [id]);

    if (quotation.length === 0) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    res.json(quotation[0]);
  } catch (err) {
    handleDbError(res, err);
  }
});

// POST create quotation
router.post('/', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { job_id, quotation_number, quotation_date, amount } = req.body;

    if (!job_id || !quotation_number || !quotation_date || amount === undefined) {
      await connection.rollback();
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [existing] = await connection.query(
      'SELECT id FROM quotations WHERE quotation_number = ?',
      [quotation_number]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(409).json({ error: 'Quotation number already exists' });
    }

    const [job] = await connection.query(
      'SELECT id FROM jobs WHERE id = ?',
      [job_id]
    );

    if (job.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Job not found' });
    }

    const [result] = await connection.query(
      `INSERT INTO quotations 
       (job_id, quotation_number, quotation_date, amount, status)
       VALUES (?, ?, ?, ?, 'sent')`,
      [job_id, quotation_number, quotation_date, amount]
    );

    await connection.query(
      'UPDATE jobs SET status = "pending_approval" WHERE id = ?',
      [job_id]
    );

    await connection.commit();

    const [newQuotation] = await connection.query(
      'SELECT * FROM quotations WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newQuotation[0]);
  } catch (err) {
    await connection.rollback();
    console.error('Error creating quotation:', err);
    res.status(500).json({ error: 'Failed to create quotation' });
  } finally {
    connection.release();
  }
});

// PATCH update quotation
router.patch('/:id', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { quotation_number, quotation_date, amount, status } = req.body;

    const [existing] = await connection.query(
      'SELECT id, job_id FROM quotations WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Quotation not found' });
    }

    const updates = [];
    const params = [];

    if (quotation_number !== undefined) {
      const [duplicate] = await connection.query(
        'SELECT id FROM quotations WHERE quotation_number = ? AND id != ?',
        [quotation_number, id]
      );
      if (duplicate.length > 0) {
        await connection.rollback();
        return res.status(409).json({ error: 'Quotation number already exists' });
      }
      updates.push('quotation_number = ?');
      params.push(quotation_number);
    }

    if (quotation_date !== undefined) {
      updates.push('quotation_date = ?');
      params.push(quotation_date);
    }

    if (amount !== undefined) {
      updates.push('amount = ?');
      params.push(amount);
    }

    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');

    params.push(id);

    const query = `UPDATE quotations SET ${updates.join(', ')} WHERE id = ?`;
    await connection.query(query, params);

    if (status === 'approved') {
      await connection.query(
        'UPDATE jobs SET status = "approved" WHERE id = ?',
        [existing[0].job_id]
      );
    }

    await connection.commit();

    const [updatedQuotation] = await connection.query(
      'SELECT * FROM quotations WHERE id = ?',
      [id]
    );

    res.json(updatedQuotation[0]);
  } catch (err) {
    await connection.rollback();
    console.error('Error updating quotation:', err);
    res.status(500).json({ error: 'Failed to update quotation' });
  } finally {
    connection.release();
  }
});

export default router;
