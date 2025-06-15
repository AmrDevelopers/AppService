-- Existing job_requests table (as per your schema)
CREATE TABLE IF NOT EXISTS `job_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `job_number` varchar(20) NOT NULL,
  `date` date NOT NULL,
  `job_type` enum('ACCREDITED','NON-ACCREDITED') NOT NULL,
  `customer_id` int NOT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `job_number` (`job_number`),
  KEY `customer_id` (`customer_id`),
  KEY `created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Existing job_sequences table (as per your schema)
CREATE TABLE IF NOT EXISTS `job_sequences` (
  `sequence_date` date NOT NULL,
  `job_type` enum('Accredited','Non-Accredited') NOT NULL,
  `last_sequence` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`sequence_date`,`job_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- New certificates table for calibration certificates
CREATE TABLE IF NOT EXISTS `certificates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `job_request_id` int NOT NULL,
  `certificate_number` varchar(50) NOT NULL,
  `date_of_calibration` date NOT NULL,
  `calibration_due_date` date NOT NULL,
  `customer_name` varchar(100) NOT NULL,
  `equipment_details` varchar(255) NOT NULL,
  `location` varchar(100) NOT NULL,
  `notification_sent` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `certificate_number` (`certificate_number`),
  KEY `job_request_id` (`job_request_id`),
  CONSTRAINT `certificates_ibfk_1` FOREIGN KEY (`job_request_id`) REFERENCES `job_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Add notifications_enabled column to job_requests table
ALTER TABLE `job_requests` 
ADD COLUMN IF NOT EXISTS `notifications_enabled` tinyint(1) NOT NULL DEFAULT '1' AFTER `created_by`;

-- Customers table (assuming you need one)
CREATE TABLE IF NOT EXISTS `customers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `contact_person` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Notification logs table
CREATE TABLE IF NOT EXISTS `notification_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `certificate_id` int NOT NULL,
  `job_request_id` int NOT NULL,
  `notification_type` enum('EMAIL','SMS','SYSTEM') NOT NULL DEFAULT 'EMAIL',
  `sent_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `recipient_email` varchar(100) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `content` text,
  `status` enum('SENT','FAILED','PENDING') NOT NULL DEFAULT 'SENT',
  PRIMARY KEY (`id`),
  KEY `certificate_id` (`certificate_id`),
  KEY `job_request_id` (`job_request_id`),
  CONSTRAINT `notification_logs_ibfk_1` FOREIGN KEY (`certificate_id`) REFERENCES `certificates` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notification_logs_ibfk_2` FOREIGN KEY (`job_request_id`) REFERENCES `job_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;