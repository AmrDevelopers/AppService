CREATE TABLE IF NOT EXISTS service_tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  task_number VARCHAR(20) NOT NULL UNIQUE,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  due_date DATETIME NOT NULL,
  task_type ENUM('Installation', 'Maintenance', 'Repair', 'Inspection', 'Other') NOT NULL,
  status ENUM('Pending', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Pending',
  priority ENUM('Low', 'Medium', 'High', 'Urgent') DEFAULT 'Medium',
  location VARCHAR(255),
  estimated_hours DECIMAL(5,2),
  customer_id INT,
  job_reference VARCHAR(36),  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS service_task_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  task_id INT NOT NULL,
  technician_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES service_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_assignment (task_id, technician_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

