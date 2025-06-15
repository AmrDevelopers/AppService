import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all customers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [customers] = await pool.query('SELECT * FROM customers ORDER BY name');
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Failed to fetch customers' });
  }
});

// Create new customer (fixed version)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, address, contactPerson, phone, email } = req.body;

    // Validate required fields
    if (!name || !contactPerson || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name, contact person, and phone are required fields'
      });
    }

    // Insert into database
    const [result] = await pool.execute(
      `INSERT INTO customers 
      (name, address, contact_person, phone, email)
      VALUES (?, ?, ?, ?, ?)`,
      [name, address || null, contactPerson, phone, email || null]
    );

    // Get the newly created customer
    const [customer] = await pool.execute(
      'SELECT * FROM customers WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: customer[0]
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({
      message: error.code === 'ER_DUP_ENTRY'
        ? 'Customer already exists'
        : 'Failed to create customer'
    });
  }
});

export default router;