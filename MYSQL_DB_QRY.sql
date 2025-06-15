-- Customers table
CREATE TABLE customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address TEXT,
  contact_person VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Jobs table
CREATE TABLE jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_number VARCHAR(20) UNIQUE NOT NULL,
  customer_id INT NOT NULL,
  taken_by VARCHAR(100) NOT NULL,
  remark TEXT,
  scale_make VARCHAR(100),
  scale_model VARCHAR(100),
  scale_serial VARCHAR(100),
  status ENUM(
    'pending_inspection',
    'pending_quotation',
    'pending_approval',
    'approved',
    'ready_for_delivery',
    'completed'
  ) NOT NULL DEFAULT 'pending_inspection',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Inspections table
CREATE TABLE inspections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  problems_found TEXT,
  inspected_by VARCHAR(100) NOT NULL,
  inspection_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

-- Spare parts used
CREATE TABLE inspection_spare_parts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inspection_id INT NOT NULL,
  part_name VARCHAR(100) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (inspection_id) REFERENCES inspections(id)
);

-- Quotations table
CREATE TABLE quotations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  quotation_number VARCHAR(20) UNIQUE NOT NULL,
  amount DECIMAL(10,2),
  status ENUM('draft', 'sent', 'approved', 'rejected') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

-- Approvals table
CREATE TABLE approvals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  lpo_number VARCHAR(50),
  approved_by VARCHAR(100),
  approval_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

-- Delivery table
CREATE TABLE deliveries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  invoice_number VARCHAR(50),
  invoice_amount DECIMAL(10,2),
  invoice_date DATE,
  delivered_by VARCHAR(100),
  delivery_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);