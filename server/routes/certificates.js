import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/certificates?job_request_id=:jobId
router.get('/', authenticateToken, async (req, res) => {
  try {
    const jobId = parseInt(req.query.job_request_id, 10);
    
    if (!jobId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid job_request_id parameter is required' 
      });
    }

    const [certificates] = await pool.query(
      `SELECT * FROM certificates 
       WHERE job_request_id = ? 
       ORDER BY date_of_calibration DESC`,
      [jobId]
    );

    res.json({ success: true, data: certificates });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch certificates' 
    });
  }
});

// POST /api/certificates
// In your certificates router file
router.post('/', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { job_request_id } = req.body;

    // 1. Validate job exists and get job number
    const [job] = await connection.query(
      'SELECT id, job_number FROM job_requests WHERE id = ?',
      [job_request_id]
    );
    
    if (!job.length) {
      await connection.rollback();
      return res.status(404).json({ 
        success: false, 
        message: 'Job request not found' 
      });
    }

    const jobNumber = job[0].job_number; // e.g., "ASC25/051401"

    // 2. Find the highest existing sequence number for this job
    const [existingCertificates] = await connection.query(
      `SELECT certificate_number 
       FROM certificates 
       WHERE job_request_id = ? 
       AND certificate_number LIKE ?`,
      [job_request_id, `${jobNumber}-%`]
    );

    // 3. Extract sequence numbers and find the maximum
    let maxSeq = 0;
    existingCertificates.forEach(cert => {
      const seqPart = cert.certificate_number.split('-')[1];
      const seqNumber = parseInt(seqPart, 10);
      if (!isNaN(seqNumber)) {
        maxSeq = Math.max(maxSeq, seqNumber);
      }
    });

    // 4. Generate new certificate number
    const newSeq = maxSeq + 1;
    const paddedSeq = String(newSeq).padStart(2, '0');
    const certificate_number = `${jobNumber}-${paddedSeq}`;

    // 5. Insert new certificate with all fields
    await connection.query(
      `INSERT INTO certificates (
        job_request_id,
        certificate_number,
        date_of_calibration,
        calibration_due_date,
        customer_name,
        equipment_details,
        location,
        make,
        model,
        capacity,
        serial_no,
        asset_no,
        notification_sent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        job_request_id,
        certificate_number,
        req.body.date_of_calibration,
        req.body.calibration_due_date,
        req.body.customer_name,
        req.body.equipment_details,
        req.body.location,
        req.body.make || null,
        req.body.model || null,
        req.body.capacity || null,
        req.body.serial_no || null,
        req.body.asset_no || null,
        req.body.notification_sent || false
      ]
    );

    await connection.commit();
    
    // 6. Return the newly created certificate
    const [newCertificate] = await connection.query(
      'SELECT * FROM certificates WHERE certificate_number = ?',
      [certificate_number]
    );
    
    res.status(201).json({ 
      success: true, 
      data: newCertificate[0] 
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error creating certificate:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create certificate' 
    });
  } finally {
    if (connection) connection.release();
  }
});

// PUT /api/certificates/:id - Update existing certificate
router.put('/:id', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { 
      equipment_details,
      location,
      date_of_calibration,
      calibration_due_date,
      make,
      model,
      capacity,
      serial_no,
      asset_no
    } = req.body;

    // Convert ISO dates to MySQL format (YYYY-MM-DD)
    const formattedCalibrationDate = date_of_calibration.split('T')[0];
    const formattedDueDate = calibration_due_date.split('T')[0];

    await connection.query(
      `UPDATE certificates SET
        equipment_details = ?,
        location = ?,
        date_of_calibration = ?,
        calibration_due_date = ?,
        make = ?,
        model = ?,
        capacity = ?,
        serial_no = ?,
        asset_no = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        equipment_details,
        location,
        formattedCalibrationDate,
        formattedDueDate,
        make,
        model,
        capacity,
        serial_no,
        asset_no,
        id
      ]
    );

    await connection.commit();
    
    const [updatedCertificate] = await connection.query(
      'SELECT * FROM certificates WHERE id = ?',
      [id]
    );
    
    res.json({ success: true, data: updatedCertificate[0] });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error updating certificate:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update certificate' 
    });
  } finally {
    if (connection) connection.release();
  }
});

export default router;