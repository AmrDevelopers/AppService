import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Helper function for error handling
const handleError = (res, error, message = 'An error occurred') => {
  console.error(message, error);
  res.status(500).json({ error: message });
};

// Helper function to validate job data
const validateJobData = (data) => {
  const requiredFields = [
    'jobType', 'customerId', 'description', 
    'requiredDate', 'estimatedHours', 'priority', 
    'status', 'location'
  ];
  
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    return {
      valid: false,
      message: `Missing required fields: ${missingFields.join(', ')}`
    };
  }
  
  if (isNaN(data.customerId) || data.customerId <= 0) {
    return {
      valid: false,
      message: 'Invalid customer ID'
    };
  }
  
  if (isNaN(data.estimatedHours) || data.estimatedHours <= 0) {
    return {
      valid: false,
      message: 'Estimated hours must be a positive number'
    };
  }
  
  return { valid: true };
};

// Get all service tasks with pagination and filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Extract query parameters
    const { 
      page = 1, 
      limit = 20, 
      status, 
      priority, 
      jobType,
      assignedTo
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Base query
    let query = `
      SELECT 
        st.*, 
        c.name AS customer_name,
        GROUP_CONCAT(DISTINCT u.name) AS assigned_technicians,
        GROUP_CONCAT(DISTINCT u.id) AS assigned_technician_ids
      FROM service_tasks st
      LEFT JOIN customers c ON st.customer_id = c.id
      LEFT JOIN service_task_assignments sta ON st.id = sta.task_id
      LEFT JOIN users u ON sta.technician_id = u.id
    `;
    
    // WHERE conditions
    const conditions = [];
    const params = [];
    
    if (status) {
      conditions.push('st.status = ?');
      params.push(status);
    }
    
    if (priority) {
      conditions.push('st.priority = ?');
      params.push(priority);
    }
    
    if (jobType) {
      conditions.push('st.task_type = ?');
      params.push(jobType);
    }
    
    if (assignedTo) {
      conditions.push('sta.technician_id = ?');
      params.push(assignedTo);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    // GROUP BY and ORDER
    query += `
      GROUP BY st.id
      ORDER BY 
        CASE st.priority
          WHEN 'Urgent' THEN 1
          WHEN 'High' THEN 2
          WHEN 'Medium' THEN 3
          WHEN 'Low' THEN 4
        END,
        st.due_date
      LIMIT ? OFFSET ?
    `;
    
    params.push(parseInt(limit), offset);
    
    // Execute query
    const [tasks] = await pool.query(query, params);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(DISTINCT st.id) as total FROM service_tasks st';
    if (conditions.length > 0) {
      countQuery += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    const [countResult] = await pool.query(countQuery, params.slice(0, -2));
    const total = countResult[0].total;
    
    // Format the tasks for the frontend
    const formattedTasks = tasks.map(task => ({
      id: task.id.toString(),
      jobNumber: task.task_number,
      requiredDate: task.due_date,
      jobType: task.task_type,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignedTo: task.assigned_technician_ids ? task.assigned_technician_ids.split(',').map(id => id.toString()) : [],
      requiredSkills: [], // You'll need to implement skills separately
      location: task.location,
      estimatedHours: task.estimated_hours,
      customerId: task.customer_id,
      customerName: task.customer_name
    }));

    res.json({
      tasks: formattedTasks,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    handleError(res, error, 'Failed to fetch tasks');
  }
});

// Get a single service task
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [tasks] = await pool.query(`
      SELECT 
        st.*, 
        c.name AS customer_name,
        GROUP_CONCAT(DISTINCT u.name) AS assigned_technicians,
        GROUP_CONCAT(DISTINCT u.id) AS assigned_technician_ids
      FROM service_tasks st
      LEFT JOIN customers c ON st.customer_id = c.id
      LEFT JOIN service_task_assignments sta ON st.id = sta.task_id
      LEFT JOIN users u ON sta.technician_id = u.id
      WHERE st.id = ?
      GROUP BY st.id
    `, [req.params.id]);

    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = tasks[0];
    const formattedTask = {
      id: task.id.toString(),
      jobNumber: task.task_number,
      requiredDate: task.due_date,
      jobType: task.task_type,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignedTo: task.assigned_technician_ids ? task.assigned_technician_ids.split(',').map(id => id.toString()) : [],
      requiredSkills: [], // Implement skills as needed
      location: task.location,
      estimatedHours: task.estimated_hours,
      customerId: task.customer_id,
      customerName: task.customer_name
    };

    res.json(formattedTask);
  } catch (error) {
    handleError(res, error, 'Failed to fetch task');
  }
});

// Create a new service task
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      jobType,
      customerId,
      description,
      requiredDate,
      estimatedHours,
      priority,
      status,
      location,
      requiredSkills = []
    } = req.body;

    // Validate input
    const validation = validateJobData(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.message });
    }

    // Generate a unique task number
    const taskNumber = 'JB' + Date.now().toString().slice(-6);

    // Start transaction
    await pool.query('START TRANSACTION');

    // Insert task
    const [result] = await pool.query(`
      INSERT INTO service_tasks (
        task_number,
        title,
        description,
        due_date,
        task_type,
        status,
        priority,
        location,
        estimated_hours,
        customer_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      taskNumber,
      description.substring(0, 100), // Using first part of description as title
      description,
      requiredDate,
      jobType,
      status,
      priority,
      location,
      estimatedHours,
      customerId
    ]);

    const newTaskId = result.insertId;

    // Insert required skills if any
    if (requiredSkills.length > 0) {
      const skillValues = requiredSkills.map(skill => [newTaskId, skill]);
      await pool.query(`
        INSERT INTO task_required_skills (task_id, skill)
        VALUES ?
      `, [skillValues]);
    }

    // Commit transaction
    await pool.query('COMMIT');

    // Get the newly created task with customer name
    const [tasks] = await pool.query(`
      SELECT st.*, c.name AS customer_name
      FROM service_tasks st
      LEFT JOIN customers c ON st.customer_id = c.id
      WHERE st.id = ?
    `, [newTaskId]);

    const newTask = tasks[0];

    res.status(201).json({
      id: newTask.id.toString(),
      jobNumber: newTask.task_number,
      requiredDate: newTask.due_date,
      jobType: newTask.task_type,
      description: newTask.description,
      status: newTask.status,
      priority: newTask.priority,
      assignedTo: [],
      requiredSkills,
      location: newTask.location,
      estimatedHours: newTask.estimated_hours,
      customerId: newTask.customer_id,
      customerName: newTask.customer_name
    });
  } catch (error) {
    // Rollback on error
    await pool.query('ROLLBACK');
    handleError(res, error, 'Failed to create task');
  }
});

// Update a service task
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const taskId = req.params.id;
    const {
      jobType,
      customerId,
      description,
      requiredDate,
      estimatedHours,
      priority,
      status,
      location,
      requiredSkills = []
    } = req.body;

    // Validate input
    const validation = validateJobData(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.message });
    }

    // Start transaction
    await pool.query('START TRANSACTION');

    // Update task
    await pool.query(`
      UPDATE service_tasks SET
        task_type = ?,
        description = ?,
        due_date = ?,
        estimated_hours = ?,
        priority = ?,
        status = ?,
        location = ?,
        customer_id = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      jobType,
      description,
      requiredDate,
      estimatedHours,
      priority,
      status,
      location,
      customerId,
      taskId
    ]);

    // Update required skills
    await pool.query('DELETE FROM task_required_skills WHERE task_id = ?', [taskId]);
    
    if (requiredSkills.length > 0) {
      const skillValues = requiredSkills.map(skill => [taskId, skill]);
      await pool.query(`
        INSERT INTO task_required_skills (task_id, skill)
        VALUES ?
      `, [skillValues]);
    }

    // Commit transaction
    await pool.query('COMMIT');

    // Get the updated task with customer name
    const [tasks] = await pool.query(`
      SELECT st.*, c.name AS customer_name
      FROM service_tasks st
      LEFT JOIN customers c ON st.customer_id = c.id
      WHERE st.id = ?
    `, [taskId]);

    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updatedTask = tasks[0];

    // Get assigned technicians
    const [assignments] = await pool.query(`
      SELECT u.id, u.name
      FROM service_task_assignments sta
      JOIN users u ON sta.technician_id = u.id
      WHERE sta.task_id = ?
    `, [taskId]);

    res.json({
      id: updatedTask.id.toString(),
      jobNumber: updatedTask.task_number,
      requiredDate: updatedTask.due_date,
      jobType: updatedTask.task_type,
      description: updatedTask.description,
      status: updatedTask.status,
      priority: updatedTask.priority,
      assignedTo: assignments.map(a => a.id.toString()),
      requiredSkills,
      location: updatedTask.location,
      estimatedHours: updatedTask.estimated_hours,
      customerId: updatedTask.customer_id,
      customerName: updatedTask.customer_name
    });
  } catch (error) {
    // Rollback on error
    await pool.query('ROLLBACK');
    handleError(res, error, 'Failed to update task');
  }
});

// Assign a technician to a task
router.post('/:id/assign', authenticateToken, async (req, res) => {
  try {
    const taskId = req.params.id;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if task exists
    const [tasks] = await pool.query('SELECT * FROM service_tasks WHERE id = ?', [taskId]);
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user exists and is a technician
    const [users] = await pool.query('SELECT * FROM users WHERE id = ? AND role = "Technician"', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'Technician not found' });
    }

    // Check if assignment already exists
    const [existing] = await pool.query(
      'SELECT * FROM service_task_assignments WHERE task_id = ? AND technician_id = ?',
      [taskId, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Technician already assigned to this task' });
    }

    // Create new assignment
    await pool.query(
      'INSERT INTO service_task_assignments (task_id, technician_id) VALUES (?, ?)',
      [taskId, userId]
    );

    res.json({ success: true });
  } catch (error) {
    handleError(res, error, 'Failed to assign technician');
  }
});

// Unassign a technician from a task
router.post('/:id/unassign', authenticateToken, async (req, res) => {
  try {
    const taskId = req.params.id;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Delete assignment
    const [result] = await pool.query(
      'DELETE FROM service_task_assignments WHERE task_id = ? AND technician_id = ?',
      [taskId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json({ success: true });
  } catch (error) {
    handleError(res, error, 'Failed to unassign technician');
  }
});

// Delete a service task
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Start transaction
    await pool.query('START TRANSACTION');

    // First delete assignments to avoid foreign key constraints
    await pool.query('DELETE FROM service_task_assignments WHERE task_id = ?', [req.params.id]);

    // Delete required skills
    await pool.query('DELETE FROM task_required_skills WHERE task_id = ?', [req.params.id]);

    // Then delete the task
    const [result] = await pool.query('DELETE FROM service_tasks WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Task not found' });
    }

    // Commit transaction
    await pool.query('COMMIT');

    res.json({ success: true });
  } catch (error) {
    // Rollback on error
    await pool.query('ROLLBACK');
    handleError(res, error, 'Failed to delete task');
  }
});

export default router;