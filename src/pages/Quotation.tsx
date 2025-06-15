import React, { useState, useEffect } from 'react';
import { Calendar, FileText, User, UserCheck, Loader2, X, Check } from 'lucide-react';
import axios from 'axios';

interface SparePart {
  id: number;
  part_name: string;
  quantity: number;
  unit_price: number;
}

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

interface QuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  inspection: Inspection | null;
  onSave: (quotationData: QuotationData) => Promise<void>;
  isLoading: boolean;
}

interface QuotationData {
  quotationNumber: string;
  quotationDate: string;
  amount: number;
}

const QuotationModal: React.FC<QuotationModalProps> = ({
  isOpen,
  onClose,
  job,
  inspection,
  onSave,
  isLoading
}) => {
  const [quotationData, setQuotationData] = useState<QuotationData>({
    quotationNumber: '',
    quotationDate: new Date().toISOString().split('T')[0],
    amount: 0
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (job) {
      setQuotationData(prev => ({
        ...prev,
        quotationNumber: `QT-${job.job_number}-${new Date().getFullYear()}`,
        amount: inspection?.total_cost || 0
      }));
    }
  }, [job, inspection]);

  if (!isOpen || !job) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(quotationData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold">Create Quotation</h2>
          <button onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Job Details Preview */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-lg mb-3">Job Details Preview</h3>
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
                    <p className="text-sm text-gray-600">Serial Number</p>
                    <p className="font-medium">{job.scale_serial}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Inspection Details Preview */}
            {inspection && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-lg mb-3">Inspection Details Preview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Inspected By</p>
                    <p className="font-medium">{inspection.inspected_by}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Inspection Date</p>
                    <p className="font-medium">
                      {new Date(inspection.inspection_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {inspection.problems_found && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Problems Found</p>
                    <div className="mt-1 p-3 bg-gray-50 rounded border border-gray-200">
                      <p className="whitespace-pre-line">
                        {inspection.problems_found}
                      </p>
                    </div>
                  </div>
                )}

                {inspection.notes && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Technician Notes</p>
                    <div className="mt-1 p-3 bg-gray-50 rounded border border-gray-200">
                      <p className="whitespace-pre-line">
                        {inspection.notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Spare Parts Preview */}
            {inspection?.spare_parts && inspection.spare_parts.length > 0 && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-lg mb-3">Recommended Parts Preview</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Part Name
                        </th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Qty
                        </th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {inspection.spare_parts.map((part) => (
                        <tr key={part.id}>
                          <td className="px-4 py-2 text-sm">{part.part_name}</td>
                          <td className="px-4 py-2 text-sm text-right">{part.quantity}</td>
                          <td className="px-4 py-2 text-sm text-right">{formatCurrency(part.unit_price)}</td>
                          <td className="px-4 py-2 text-sm text-right">
                            {formatCurrency(part.quantity * part.unit_price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-right font-medium">Total Parts Cost:</td>
                        <td className="px-4 py-2 text-right font-medium">
                          {formatCurrency(inspection.total_cost)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Quotation Form */}
            <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-4">Quotation Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quotation Number *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={quotationData.quotationNumber}
                    onChange={(e) => setQuotationData({
                      ...quotationData,
                      quotationNumber: e.target.value
                    })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quotation Date *
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={quotationData.quotationDate}
                    onChange={(e) => setQuotationData({
                      ...quotationData,
                      quotationDate: e.target.value
                    })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={quotationData.amount}
                    onChange={(e) => setQuotationData({
                      ...quotationData,
                      amount: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <div className="flex flex-col items-end gap-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 inline" />
                        Processing...
                      </>
                    ) : 'Save Quotation'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

const QuotationPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<number | null>(null);
  const [selectedJobs, setSelectedJobs] = useState<number[]>([]);
  const [isCompletingJobs, setIsCompletingJobs] = useState(false);

  useEffect(() => {
    const fetchPendingQuotations = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await axios.get('/api/jobs', {
          params: { status: 'pending_quotation' },
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        setJobs(response.data.data || []);
        setSelectedJobs([]); // Reset selected jobs when refreshing the list
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setError(axios.isAxiosError(err) ? err.response?.data?.message || err.message : 'Failed to load jobs. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingQuotations();
  }, []);

  const handleJobSelect = async (jobId: number) => {
    try {
      setIsFetchingDetails(true);
      setError(null);

      const token = localStorage.getItem('token');

      const jobResponse = await axios.get(`/api/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedJob(jobResponse.data);

      const inspectionResponse = await axios.get(`/api/jobs/inspections`, {
        params: { job_id: jobId },
        headers: { Authorization: `Bearer ${token}` }
      });

      let inspectionWithParts = null;
      const inspections = inspectionResponse.data.data;
      const inspection = Array.isArray(inspections) && inspections.length > 0
        ? inspections[0]
        : null;

      if (inspection) {
        const partsResponse = await axios.get(`/api/jobs/inspections/${inspection.id}/spare-parts`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const sparePartsData = partsResponse.data;
        const spareParts = sparePartsData.success && Array.isArray(sparePartsData.data)
          ? sparePartsData.data
          : [];

        inspectionWithParts = {
          ...inspection,
          spare_parts: spareParts,
          total_cost: spareParts.reduce((sum: number, part: SparePart) =>
            sum + (part.quantity * parseFloat(part.unit_price?.toString() || '0')), 0)
        };
      }

      setSelectedInspection(inspectionWithParts);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error fetching job/inspection details:', err);
      setError(axios.isAxiosError(err) ? err.response?.data?.message || err.message : 'Failed to load data. Please try again.');
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const handleSaveQuotation = async (quotationData: QuotationData) => {
    if (!selectedJob) return;

    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      const quotationResponse = await axios.post('/api/quotations', {
        job_id: selectedJob.id,
        quotation_number: quotationData.quotationNumber,
        quotation_date: quotationData.quotationDate,
        amount: quotationData.amount,
        status: 'sent'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (quotationResponse.status !== 201) {
        throw new Error(quotationResponse.data.error || 'Failed to create quotation');
      }

      const statusUpdateResponse = await axios.patch(`/api/jobs/${selectedJob.id}/status`, { status: 'pending_approval' }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (statusUpdateResponse.status !== 200) {
        console.error('Failed to update job status after quotation creation:', statusUpdateResponse.data);
      }

      const updatedResponse = await axios.get('/api/jobs', {
        params: { status: 'pending_quotation' },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setJobs(updatedResponse.data.data || []);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving quotation:', err);
      setError(axios.isAxiosError(err) ? err.response?.data?.error || err.message : 'Failed to save quotation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReport = async (jobId: number, jobNumber: string) => {
    setIsDownloading(jobId);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/jobs/${jobId}/service-report`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `service_report_job_${jobNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);

    } catch (err) {
      console.error('Error downloading report:', err);
      setError(axios.isAxiosError(err) ? err.response?.data?.message || err.message : 'Failed to download report. Please try again.');
    } finally {
      setIsDownloading(null);
    }
  };

  const handleSelectJob = (jobId: number) => {
    setSelectedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId) 
        : [...prev, jobId]
    );
  };

  const handleSelectAllJobs = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedJobs(jobs.map(job => job.id));
    } else {
      setSelectedJobs([]);
    }
  };

  const handleCompleteSelectedJobs = async () => {
    if (selectedJobs.length === 0) return;

    try {
      setIsCompletingJobs(true);
      setError(null);
      const token = localStorage.getItem('token');

      // Update each selected job
      await Promise.all(selectedJobs.map(async (jobId) => {
        await axios.patch(`/api/jobs/${jobId}/status`, 
          { status: 'ready_for_delivery' }, 
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );
      }));

      // Refresh the job list
      const response = await axios.get('/api/jobs', {
        params: { status: 'pending_quotation' },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setJobs(response.data.data || []);
      setSelectedJobs([]);
    } catch (err) {
      console.error('Error completing jobs:', err);
      setError(axios.isAxiosError(err) ? err.response?.data?.message || err.message : 'Failed to complete jobs. Please try again.');
    } finally {
      setIsCompletingJobs(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      pending_inspection: 'bg-yellow-100 text-yellow-800',
      pending_quotation: 'bg-blue-100 text-blue-800',
      pending_approval: 'bg-purple-100 text-purple-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-gray-100 text-gray-800'
    };

    return statusMap[status] || 'bg-gray-100 text-gray-800';
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
        <h1 className="text-2xl font-bold">Pending Quotations</h1>
        {selectedJobs.length > 0 && (
          <button
            onClick={handleCompleteSelectedJobs}
            disabled={isCompletingJobs}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400"
          >
            {isCompletingJobs ? (
              <Loader2 className="animate-spin h-4 w-4" />
            ) : (
              <Check className="h-4 w-4" />
            )}
               MARK {selectedJobs.length} Job{selectedJobs.length !== 1 ? 's' : ''} AS READY FOR DELIVERY
          </button>
        )}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedJobs.length === jobs.length && jobs.length > 0}
                    onChange={handleSelectAllJobs}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobs.length > 0 ? (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedJobs.includes(job.id)}
                        onChange={() => handleSelectJob(job.id)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="flex-shrink-0 h-5 w-5 text-gray-400 mr-2" />
                        <span>{formatDate(job.created_at)}</span>
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
                        <User className="flex-shrink-0 h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <p className="font-medium">{job.customer_name}</p>
                          {job.customer_phone && (
                            <p className="text-sm text-gray-500">{job.customer_phone}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        {job.scale_make && <p className="font-medium">{job.scale_make}</p>}
                        {job.scale_model && <p className="text-sm text-gray-500">{job.scale_model}</p>}
                        {job.scale_serial && <p className="text-sm text-gray-500">{job.scale_serial}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(job.status)}`}>
                        {job.status ? job.status.replace(/_/g, ' ') : 'unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex flex-col items-end gap-1">
                        <button
                          onClick={() => handleDownloadReport(job.id, job.job_number)}
                          className="text-purple-600 hover:text-purple-900 font-medium flex items-center justify-end gap-1"
                          disabled={isDownloading === job.id}
                        >
                          {isDownloading === job.id ? (
                            <Loader2 className="animate-spin h-4 w-4 inline" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                          {isDownloading === job.id ? 'Downloading...' : 'Download Report'}
                        </button>
                        <button
                          onClick={() => handleJobSelect(job.id)}
                          className="text-blue-600 hover:text-blue-900 font-medium flex items-center justify-end gap-1"
                        >
                          Create Quotation
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No jobs pending quotation
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <QuotationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        job={selectedJob}
        inspection={selectedInspection}
        onSave={handleSaveQuotation}
        isLoading={isFetchingDetails}
      />
    </div>
  );
};

export default QuotationPage;