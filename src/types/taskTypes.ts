export type JobType = 'Installation' | 'Maintenance' | 'Repair' | 'Inspection' | 'Other';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type UserRole = 'Technician' | 'Supervisor' | 'Admin' | 'Sales';

export interface Customer {
  id: number;
  name: string;
  address?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  skills: string[];
  currentJobs: number;
  avatar?: string;
}

export interface Job {
  id: number;
  jobNumber: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  jobType: JobType;
  requiredDate: string;
  location: string;
  estimatedHours: number;
  assignedTo: string[];
  customerName: string;
  createdAt: string;
}
