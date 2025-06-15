import React, { useEffect, useState } from 'react';
import { Calendar, FileText, Loader2, User, X } from 'lucide-react';

interface SparePart {
  id: number;
  part_name: string;
  quantity: number;
  unit_price: number;
}

interface Approval {
  id: number;
  job_id: number;
  lpo_number: string;
  approval_date: string;
  prepared_by: number; // This is now the user ID
  amount: number;
  status: string;
  user?: User; // Joined user data
  job_number?: string;
}

type User = {
  id: string;
  name: string;
  username: string;
  role: 'SUPER_ADMIN' | 'USER';
  created_at: string;
};


interface Inspection {
  id: number;
  job_id: number;
  problems_found: string | null;
  inspected_by: string;
  inspection_date: string;
  total_cost: number;
  notes: string | null;
  spare_parts: SparePart[];
}

interface Job {
  id: number;
  job_number: string;
  customer_id: number;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  taken_by: string;
  status: string;
  scale_make?: string;
  scale_model?: string;
  scale_serial?: string;
  created_at: string;
  updated_at: string;
}

interface LpoData {
  job_id: number,
  lpo_number: string,
  approval_date: string, // YYYY-MM-DD format
  amount: number
}

interface LpoModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  inspection: Inspection | null;
  onSave: (data: LpoData) => Promise<void>;
  isLoading: boolean;
}

const LpoModal: React.FC<LpoModalProps> = ({
  isOpen,
  onClose,
  job,
  inspection,
  onSave,
  isLoading
}) => {
  const [lpoData, setLpoData] = useState<LpoData>({
    lpoNumber: '',
    lpoDate: new Date().toISOString().split('T')[0],
    amount: 0
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (job && inspection) {
      setLpoData({
        lpoNumber: `LPO-${job.job_number}-${new Date().getFullYear()}`,
        lpoDate: new Date().toISOString().split('T')[0],
        amount: inspection.total_cost
      });
    }
  }, [job, inspection]);

  if (!isOpen || !job) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(lpoData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED'
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold">Approve Job (Add LPO)</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" disabled={isSubmitting}>
            <X className="h-6 w-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-lg mb-3">Job Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Job Number</p>
                  <p className="font-medium">{job.job_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium">{job.customer_name}</p>
                </div>
                {job.customer_phone && (
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{job.customer_phone}</p>
                  </div>
                )}
                {job.scale_make && (
                  <div>
                    <p className="text-sm text-gray-600">Scale Make</p>
                    <p className="font-medium">{job.scale_make}</p>
                  </div>
                )}
                {job.scale_model && (
                  <div>
                    <p className="text-sm text-gray-600">Scale Model</p>
                    <p className="font-medium">{job.scale_model}</p>
                  </div>
                )}
                {job.scale_serial && (
                  <div>
                    <p className="text-sm text-gray-600">Serial</p>
                    <p className="font-medium">{job.scale_serial}</p>
                  </div>
                )}
              </div>
            </div>

            {inspection && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-lg mb-3">Inspection</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Inspected By</p>
                    <p className="font-medium">{inspection.inspected_by}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Inspection Date</p>
                    <p className="font-medium">{new Date(inspection.inspection_date).toLocaleDateString()}</p>
                  </div>
                </div>
                {inspection.problems_found && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Problems</p>
                    <p className="bg-gray-50 p-2 border rounded">{inspection.problems_found}</p>
                  </div>
                )}
                {inspection.notes && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Notes</p>
                    <p className="bg-gray-50 p-2 border rounded">{inspection.notes}</p>
                  </div>
                )}
              </div>
            )}

            {inspection?.spare_parts?.length > 0 && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-lg mb-3">Spare Parts</h3>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th>Part</th>
                      <th>Qty</th>
                      <th>Unit</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {inspection.spare_parts.map(part => (
                      <tr key={part.id}>
                        <td>{part.part_name}</td>
                        <td className="text-right">{part.quantity}</td>
                        <td className="text-right">{formatCurrency(part.unit_price)}</td>
                        <td className="text-right">{formatCurrency(part.quantity * part.unit_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-4">LPO Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">LPO Number *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded"
                    value={lpoData.lpoNumber}
                    onChange={(e) => setLpoData({ ...lpoData, lpoNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">LPO Date *</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border rounded"
                    value={lpoData.lpoDate}
                    onChange={(e) => setLpoData({ ...lpoData, lpoDate: e.target.value })}
                  />
                  </div>
<div>
  <label className="block text-sm font-medium mb-1">Amount *</label>
  <input
    type="number"
    required
    className="w-full px-3 py-2 border rounded"
    value={lpoData.amount}
    onChange={(e) =>
      setLpoData({ ...lpoData, amount: e.target.value })
    }
  />
</div>
                </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 inline" /> : 'Save LPO'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

const PendingApproval: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPendingApprovals = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/jobs?status=pending_approval', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setJobs(data.data || []);
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setError('Failed to load jobs. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingApprovals();
  }, []);

  const handleJobSelect = async (jobId: number) => {
    try {
      setIsFetchingDetails(true);
      setError(null);

      const jobResponse = await fetch(`/api/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!jobResponse.ok) {
        throw new Error(`Failed to fetch job details: ${jobResponse.status}`);
      }

      const jobData = await jobResponse.json();
      setSelectedJob(jobData);

      const inspectionResponse = await fetch(`/api/jobs/inspections?job_id=${jobId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      let inspectionWithParts = null;

      if (inspectionResponse.ok) {
        const inspections = await inspectionResponse.json();
        const inspection = Array.isArray(inspections) ? inspections[0] : inspections;

        if (inspection) {
          const partsResponse = await fetch(`/api/jobs/inspections/${inspection.id}/spare-parts`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          const sparePartsData = partsResponse.ok ? await partsResponse.json() : { success: false, data: [] };

          const spareParts = sparePartsData.success && Array.isArray(sparePartsData.data) 
            ? sparePartsData.data 
            : [];

          inspectionWithParts = {
            ...inspection,
            spare_parts: spareParts,
            total_cost: spareParts.reduce((sum: number, part: SparePart) => 
              sum + (part.quantity * parseFloat(part.unit_price || '0')), 0)
          };
        }
      }

      setSelectedInspection(inspectionWithParts);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data. Please try again.');
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const handleSaveLpo = async (lpoData: LpoData) => {
  if (!selectedJob) return;

  try {
    setIsLoading(true);
    setError(null);

    // Get the logged-in user's information
    const userResponse = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!userResponse.ok) {
      throw new Error('Failed to fetch user data');
    }
    
    const userData = await userResponse.json();
    const preparedByName = userData.name || 'System'; // Fallback to 'System' if name not available

    // Save the approval with the logged-in user's name
    const response = await fetch('/api/approvals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        job_id: selectedJob.id,
        lpo_number: lpoData.lpoNumber,
        approval_date: lpoData.lpoDate,
        prepared_by: preparedByName, // Use the correct column name
        amount: lpoData.amount,
        status: 'approved'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save LPO');
    }

    // Update job status to 'approved'
    const jobUpdateResponse = await fetch(`/api/jobs/${selectedJob.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ status: 'approved' })
    });

    if (!jobUpdateResponse.ok) {
      throw new Error('Failed to update job status');
    }

    // Refresh the job list
    const updatedJobs = jobs.filter(job => job.id !== selectedJob.id);
    setJobs(updatedJobs);
    setIsModalOpen(false);
  } catch (err) {
    console.error('Error saving LPO:', err);
    setError(err instanceof Error ? err.message : 'Failed to save LPO');
  } finally {
    setIsLoading(false);
  }
};

  if (isLoading && jobs.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pending Approvals</h1>
      </div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobs.length > 0 ? (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="flex-shrink-0 h-5 w-5 text-gray-400 mr-2" />
                        <span>{new Date(job.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="flex-shrink-0 h-5 w-5 text-gray-400 mr-2" />
                        <span className="font-medium">{job.job_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <User  className="flex-shrink-0 h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <p className="font-medium">{job.customer_name}</p>
                          {job.customer_phone && (
                            <p className="text-sm text-gray-500">{job.customer_phone}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {job.scale_make && (
                        <div>
                          <p className="font-medium">{job.scale_make}</p>
                          {job.scale_model && (
                            <p className="text-sm text-gray-500">{job.scale_model}</p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(job.status)}">
                        {job.status ? job.status.replace(/_/g, ' ') : 'unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleJobSelect(job.id)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        {isFetchingDetails && selectedJob?.id === job.id ? (
                          <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 inline" />
                        ) : (
                          'Approve'
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No jobs pending approval.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <LpoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        job={selectedJob}
        inspection={selectedInspection}
        onSave={handleSaveLpo}
        isLoading={isLoading}
      />
    </div>
  );
};

export default PendingApproval;