export interface Job {
  id: number;
  job_number: string;
  status: string;
  // add other fields like customer_name, technician, etc.
}
export interface User {
  id: number;
  name: string;
  username: string;
  role: 'SUPER_ADMIN' | 'USER';
}

export interface Customer {
  id: number;
  name: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
}

export interface Job {
  id: number;
  jobNumber: string;
  customerId: number;
  make: string;
  model: string;
  serialNumber: string;
  remark: string;
  takenBy: string;
  status: 'CREATED' | 'INSPECTED' | 'QUOTED' | 'PENDING_APPROVAL' | 'APPROVED' | 'READY_FOR_DELIVERY' | 'COMPLETED';
  createdAt: string;
}

export interface Inspection {
  id: number;
  jobId: number;
  foundProblems: string;
  inspectedBy: string;
  spareParts: SparePartLine[];
  totalAmount: number;
  createdAt: string;
}

export interface SparePartLine {
  id: number;
  inspectionId: number;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Quotation {
  id: number;
  jobId: number;
  quotationNumber: string;
  quotationDate: string;
  amount: number;
}

export interface Approval {
  id: number;
  jobId: number;
  lpoNumber: string;
  referenceNumber: string;
  documentUrl: string;
}

export interface Invoice {
  id: number;
  jobId: number;
  invoiceNumber: string;
  invoiceDate: string;
  amount: number;
}