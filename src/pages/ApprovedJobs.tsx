import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, ClipboardCheck, Eye, Truck, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { useAuth } from '../contexts/AuthContext'; // Import useAuth
import { toast } from 'react-hot-toast';

interface SparePart {
  id?: string; // Added optional id field for better key management
  part_name: string;
  quantity: number;
  unit_price: number;
}

interface Job {
  id: number;
  job_number: string;
  date: string;
  customer_name: string;
  status: string;
  scale_make?: string;
  scale_model?: string;
  scale_serial?: string;
  remark?: string;
  quotation_number: string;
  quotation_amount: number;
  lpo_number?: string;
  approved_by?: string;
  approval_date?: string;
  inspection_problems?: string;
  inspected_by: string;
  inspection_date: string;
  spare_parts: SparePart[];
}

const ApprovedJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [preparedBy, setPreparedBy] = useState('');

  const navigate = useNavigate(); // Initialize useNavigate
  const { user, loading, isAuthenticated } = useAuth(); // Use the auth hook

  // Define allowed roles for this page
  const allowedRoles = ['SUPER_ADMIN', 'TECHNICIAN'];

  // Effect to check authentication and role on component mount and updates
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        // Redirect to login if not authenticated
        toast.error('Please log in to access this page.');
        navigate('/login');
      } else if (user && !allowedRoles.includes(user.role)) {
        // Redirect to home or a forbidden page if role is not allowed
        toast.error('You do not have permission to access this page.');
        navigate('/'); // Or navigate to a forbidden page like '/forbidden'
      }
    }
  }, [loading, isAuthenticated, user, navigate]);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/approvals', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setJobs(response.data.data);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load approved jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (job: Job) => {
    setSelectedJob(job);
    setShowModal(true);
  };

  const markAsReady = async () => {
    if (!selectedJob || !preparedBy.trim()) return;
  
    setIsSubmitting(true);
    setError(null);
  
    try {
      const response = await axios.put(
        `/api/approvals/${selectedJob.id}/ready`,
        { 
          status: "ready_for_delivery", // Only send the status change
          prepared_by: preparedBy.trim() 
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
  
      if (response.data?.success) {
        // Update only the status in local state without changing other data
        setJobs(prevJobs => 
          prevJobs.map(job => 
            job.id === selectedJob.id 
              ? { ...job, status: "ready_for_delivery" } 
              : job
          )
        );
        setShowModal(false);
        setPreparedBy('');

      } else {
        setError(response.data?.message || 'Unknown error occurred.');
      }
    } catch (err: any) {
      console.error('Error marking job as ready:', err);
      setError(err.response?.data?.message || 'Failed to update job status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
    }).format(amount);
  };

  // Helper function to generate unique keys for spare parts
  const getPartKey = (jobId: number, part: SparePart, index: number) => {
    return part.id 
      ? `part-${jobId}-${part.id}`
      : `part-${jobId}-${part.part_name}-${part.unit_price}-${index}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin w-6 h-6 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <ClipboardCheck className="w-6 h-6" />
        Approved Jobs
      </h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">LPO Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {jobs.map((job, index) => (
              <tr key={`job-${job.id}-${index}`} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{job.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{job.job_number}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{job.customer_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{job.lpo_number || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(job.quotation_amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleViewDetails(job)}
                    className="text-blue-600 hover:text-blue-900 flex items-center gap-1 ml-auto"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </td>
              </tr>
            ))}
            {jobs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No approved jobs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      {showModal && selectedJob && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Job Details - {selectedJob.job_number}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <h4 className="font-semibold mb-2">Customer Information</h4>
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-sm"><strong>Name:</strong> {selectedJob.customer_name}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Scale Information</h4>
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-sm"><strong>Make:</strong> {selectedJob.scale_make || '-'}</p>
                      <p className="text-sm"><strong>Model:</strong> {selectedJob.scale_model || '-'}</p>
                      <p className="text-sm"><strong>Serial:</strong> {selectedJob.scale_serial || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold mb-2">Inspection Details</h4>
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-sm"><strong>Date:</strong> {selectedJob.inspection_date}</p>
                    <p className="text-sm"><strong>Inspector:</strong> {selectedJob.inspected_by}</p>
                    {selectedJob.inspection_problems && (
                      <div className="mt-2">
                        <strong className="text-sm">Problems Found:</strong>
                        <p className="text-sm mt-1 whitespace-pre-line">{selectedJob.inspection_problems}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold mb-2">Spare Parts</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedJob.spare_parts.map((part, index) => (
                          <tr key={getPartKey(selectedJob.id, part, index)}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{part.part_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{part.quantity}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(part.unit_price)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(part.quantity * part.unit_price)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold mb-2">Approval Information</h4>
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-sm"><strong>LPO Number:</strong> {selectedJob.lpo_number || '-'}</p>
                    <p className="text-sm"><strong>Approved By:</strong> {selectedJob.approved_by}</p>
                    <p className="text-sm"><strong>Approval Date:</strong> {selectedJob.approval_date}</p>
                    <p className="text-sm"><strong>Quotation Amount:</strong> {formatCurrency(selectedJob.quotation_amount)}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-semibold mb-2">Mark as Ready for Delivery</h4>
                  <div className="flex items-end gap-4">
                    <div className="flex-grow">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prepared By
                      </label>
                      <input
                        type="text"
                        value={preparedBy}
                        onChange={(e) => setPreparedBy(e.target.value)}
                        className="w-full border rounded-md px-3 py-2"
                        placeholder="Enter name"
                      />
                    </div>
                    <button
                      onClick={markAsReady}
                      disabled={!preparedBy.trim() || isSubmitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <Loader2 className="animate-spin w-4 h-4" />
                      ) : (
                        <Truck className="w-4 h-4" />
                      )}
                      Mark as Ready
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovedJobs;