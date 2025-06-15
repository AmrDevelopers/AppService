import React, { useEffect, useState } from 'react';
import { Calendar, FileText, Loader2, User, X } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
  findings?: string;
  technician_id?: number;
  technician_name?: string;
}

interface Approval {
  id: number;
  job_id: number;
  approved_by: string;
  approval_date: string;
  notes?: string;
  lpo_number?: string;
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
  remark?: string;
  lpo_number?: string;
  quotation_number?: string;
  quotation_amount?: number;
  approved_by?: string;
  approval_date?: string;
  invoice_number?: string;
  invoice_amount?: number;
  invoice_date?: string;
  delivered_by?: string;
  delivery_date?: string;
}

interface Quotation {
  id: number;
  job_id: number;
  quotation_number: string;
  amount: number;
  status: string;
  created_at: string;
  quotation_date: string;
  description?: string;
  remarks?: string;
  lpo_document?: string;
}

interface DeliveryData {
  invoiceNumber: string;
  invoiceDate: string;
  invoiceAmount: number;
  deliveredBy: string;
  deliveryDate: string;
}

interface DeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  inspection: Inspection | null;
  quotation: Quotation | null;
  approval: Approval | null;
  onSave: (data: DeliveryData) => Promise<void>;
  isLoading: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED'
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const DeliveryModal: React.FC<DeliveryModalProps> = ({
  isOpen,
  onClose,
  job,
  inspection,
  quotation,
  approval,
  onSave,
  isLoading
}) => {
  const [deliveryData, setDeliveryData] = useState<DeliveryData>({
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    invoiceAmount: 0,
    deliveredBy: '',
    deliveryDate: new Date().toISOString().split('T')[0]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (job && inspection) {
      setDeliveryData({
        invoiceNumber: job.invoice_number || '',
        invoiceDate: job.invoice_date ? new Date(job.invoice_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        invoiceAmount: job.invoice_amount || inspection.total_cost || 0,
        deliveredBy: job.delivered_by || '',
        deliveryDate: job.delivery_date ? new Date(job.delivery_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
    }
  }, [job, inspection]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!deliveryData.invoiceNumber.trim()) {
      errors.invoiceNumber = 'Invoice number is required';
    }

    if (!deliveryData.invoiceDate) {
      errors.invoiceDate = 'Invoice date is required';
    }

    if (deliveryData.invoiceAmount <= 0) {
      errors.invoiceAmount = 'Invoice amount must be greater than 0';
    }

    if (!deliveryData.deliveredBy.trim()) {
      errors.deliveredBy = 'Delivered by is required';
    }

    if (!deliveryData.deliveryDate) {
      errors.deliveryDate = 'Delivery date is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(deliveryData);
      toast.success('Delivery details saved successfully');
    } catch (error) {
      toast.error('Failed to save delivery details');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDeliveryData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  if (!isOpen || !job) return null;

  console.log("DeliveryModal received props:", { job, inspection, quotation, approval, isLoading });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto"> <div className="bg-white rounded-lg p-6 w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-2xl font-bold">Ready for Delivery</h2>
        <button
          onClick={onClose}
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
          {/* Job Details Section */}
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
              {job.lpo_number && (
                <div>
                  <p className="text-sm text-gray-600">LPO Number</p>
                  <p className="font-medium">{job.lpo_number}</p>
                </div>
              )}
              {job.remark && (
                <div className="md:col-span-3">
                  <p className="text-sm text-gray-600">Remarks</p>
                  <p className="font-medium">{job.remark}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quotation Section */}
          {quotation && (
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-lg mb-3">Quotation Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Quotation Number</p>
                  <p className="font-medium">{quotation.quotation_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-medium">{formatCurrency(quotation.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-medium">{quotation.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">{formatDate(quotation.quotation_date)}</p>
                </div>
                {quotation.description && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Description</p>
                    <p className="font-medium">{quotation.description}</p>
                  </div>
                )}
                {quotation.remarks && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Remarks</p>
                    <p className="font-medium">{quotation.remarks}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Approval Section */}
          {approval && (
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-lg mb-3">Approval Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Approved By</p>
                  <p className="font-medium">{approval.approved_by}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Approval Date</p>
                  <p className="font-medium">{formatDate(approval.approval_date)}</p>
                </div>
                {approval.lpo_number && (
                  <div>
                    <p className="text-sm text-gray-600">LPO Number</p>
                    <p className="font-medium">{approval.lpo_number}</p>
                  </div>
                )}
                {approval.notes && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Notes</p>
                    <p className="font-medium">{approval.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Inspection Section */}
          {inspection && (
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-lg mb-3">Inspection Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Inspected By</p>
                  <p className="font-medium">{inspection.inspected_by}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Inspection Date</p>
                  <p className="font-medium">{formatDate(inspection.inspection_date)}</p>
                </div>
                {inspection.technician_name && (
                  <div>
                    <p className="text-sm text-gray-600">Technician</p>
                    <p className="font-medium">{inspection.technician_name}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Total Cost</p>
                  <p className="font-medium">{formatCurrency(inspection.total_cost)}</p>
                </div>
              </div>
              {inspection.problems_found && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Problems Found</p>
                  <p className="bg-gray-50 p-2 border rounded">{inspection.problems_found}</p>
                </div>
              )}
              {inspection.findings && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Findings</p>
                  <p className="bg-gray-50 p-2 border rounded">{inspection.findings}</p>
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

          {/* Spare Parts Section */}
          {inspection?.spare_parts && Array.isArray(inspection.spare_parts) && inspection.spare_parts.length > 0 && (
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-lg mb-3">Spare Parts</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Name</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {inspection.spare_parts.map((part) => (
                      <tr key={part.id}>
                        <td className="px-4 py-2 whitespace-nowrap">{part.part_name}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-right">{part.quantity}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-right">{formatCurrency(part.unit_price)}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-right">
                          {formatCurrency(part.quantity * part.unit_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-right font-medium">Total</td>
                      <td className="px-4 py-2 text-right font-medium">
                        {formatCurrency(inspection.spare_parts.reduce(
                          (sum, part) => sum + (part.quantity * part.unit_price), 0
                        ))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Delivery Form Section */}
          <form onSubmit={handleDeliverySubmit} className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-lg mb-4">Delivery Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Invoice Number */}
              <div>
                <label className="block text-sm font-medium mb-1">Invoice Number *</label>
                <input
                  type="text"
                  name="invoiceNumber"
                  required
                  className={`w-full px-3 py-2 border rounded-md ${formErrors.invoiceNumber ? 'border-red-500' : 'border-gray-300'}`}
                  value={deliveryData.invoiceNumber}
                  onChange={handleInputChange}
                />
                {formErrors.invoiceNumber && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.invoiceNumber}</p>
                )}
              </div>

              {/* Invoice Date */}
              <div>
                <label className="block text-sm font-medium mb-1">Invoice Date *</label>
                <input
                  type="date"
                  name="invoiceDate"
                  required
                  className={`w-full px-3 py-2 border rounded-md ${formErrors.invoiceDate ? 'border-red-500' : 'border-gray-300'}`}
                  value={deliveryData.invoiceDate}
                  onChange={handleInputChange}
                />
                {formErrors.invoiceDate && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.invoiceDate}</p>
                )}
              </div>

              {/* Invoice Amount */}
              <div>
                <label className="block text-sm font-medium mb-1">Invoice Amount (AED) *</label>
                <input
                  type="number"
                  name="invoiceAmount"
                  required
                  min="0.01"
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-md ${formErrors.invoiceAmount ? 'border-red-500' : 'border-gray-300'}`}
                  value={deliveryData.invoiceAmount}
                  onChange={(e) => {
                    setDeliveryData({
                      ...deliveryData,
                      invoiceAmount: parseFloat(e.target.value) || 0
                    });
                    if (formErrors.invoiceAmount) {
                      setFormErrors({
                        ...formErrors,
                        invoiceAmount: ''
                      });
                    }
                  }}
                />
                {formErrors.invoiceAmount && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.invoiceAmount}</p>
                )}
              </div>

              {/* Delivered By */}
              <div>
                <label className="block text-sm font-medium mb-1">Delivered By *</label>
                <input
                  type="text"
                  name="deliveredBy"
                  required
                  className={`w-full px-3 py-2 border rounded-md ${formErrors.deliveredBy ? 'border-red-500' : 'border-gray-300'}`}
                  value={deliveryData.deliveredBy}
                  onChange={handleInputChange}
                  placeholder="Enter deliverer's name"
                />
                {formErrors.deliveredBy && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.deliveredBy}</p>
                )}
              </div>

              {/* Delivery Date */}
              <div>
                <label className="block text-sm font-medium mb-1">Delivery Date *</label>
                <input
                  type="date"
                  name="deliveryDate"
                  required
                  className={`w-full px-3 py-2 border rounded-md ${formErrors.deliveryDate ? 'border-red-500' : 'border-gray-300'}`}
                  value={deliveryData.deliveryDate}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split('T')[0]} // Can't deliver in future
                />
                {formErrors.deliveryDate && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.deliveryDate}</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 inline" />
                    Saving...
                  </>
                ) : (
                  'Save Delivery Details'
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
    </div>
  );
};

const ReadyForDelivery: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReadyForDeliveryJobs = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/jobs?status=ready_for_delivery', {
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
        toast.error('Failed to load jobs');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReadyForDeliveryJobs();
  }, []);

  const handleJobSelect = async (jobId: number) => {
    try {
      setIsFetchingDetails(true);
      setError(null);

      // Fetch all data in parallel
      const [jobResponse, quotationResponse, inspectionResponse, approvalResponse] = await Promise.all([
        fetch(`/api/jobs/${jobId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`/api/quotations?job_id=${jobId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'cache': 'no-cache' }
        }),
        fetch(`/api/jobs/inspections?job_id=${jobId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'cache': 'no-cache' }
        }),
        fetch(`/api/approvals?job_id=${jobId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'cache': 'no-cache' }
        })
      ]);

      // Process job data
      if (!jobResponse.ok) throw new Error('Failed to fetch job details');
      const jobData = await jobResponse.json();
      console.log("Fetched Job Data:", jobData);
      setSelectedJob(jobData);
      console.log("Selected Job State:", jobData);


      // Process quotation data
      let quotationData = null;
      if (quotationResponse.ok) {
        const quotations = await quotationResponse.json();
        console.log("Fetched Quotations:", quotations);
        // Corrected: Access the data array within the response
        quotationData = quotations && Array.isArray(quotations.data) && quotations.data.length > 0 ? quotations.data[0] : null;
      }
      setSelectedQuotation(quotationData);
      console.log("Selected Quotation State:", quotationData);


      // Process inspection data
      let inspectionWithParts = null;
      if (inspectionResponse.ok) {
        const inspections = await inspectionResponse.json();
        console.log("Fetched Inspections:", inspections);
        const inspection = Array.isArray(inspections) ? inspections[0] : inspections;

        if (inspection) {
          // Fetch spare parts
          const partsResponse = await fetch(`/api/jobs/inspections/${inspection.id}/spare-parts`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          const spareParts = partsResponse.ok ? await partsResponse.json() : [];
          console.log("Fetched Spare Parts:", spareParts);


          // Ensure spareParts is an array before using it in reduce
          const safeSpareParts = Array.isArray(spareParts) ? spareParts : [];

          inspectionWithParts = {
            ...inspection,
            spare_parts: safeSpareParts,
            total_cost: safeSpareParts.reduce(
              (sum: number, part: SparePart) => sum + (part.quantity * part.unit_price),
              inspection.total_cost || 0
            )
          };
          console.log("Processed Inspection Data:", inspectionWithParts);
        }
      }
      setSelectedInspection(inspectionWithParts);
      console.log("Selected Inspection State:", inspectionWithParts);


      // Process approval data
      let approvalData = null;
      if (approvalResponse.ok) {
        const approvals = await approvalResponse.json();
        console.log("Fetched Approvals:", approvals);
        // Corrected: Access the data array within the response
        approvalData = approvals && Array.isArray(approvals.data) && approvals.data.length > 0 ? approvals.data[0] : null;
      }
      setSelectedApproval(approvalData);
      console.log("Selected Approval State:", approvalData);


      setIsDeliveryModalOpen(true);
    } catch (err) {
      console.error('Error loading job details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load job details');
      toast.error('Failed to load job details');
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const handleSaveDelivery = async (deliveryData: DeliveryData) => {
    if (!selectedJob) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/jobs/${selectedJob.id}/delivery`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          invoice_number: deliveryData.invoiceNumber,
          invoice_amount: deliveryData.invoiceAmount,
          invoice_date: deliveryData.invoiceDate,
          delivered_by: deliveryData.deliveredBy,
          delivery_date: deliveryData.deliveryDate,
          status: 'completed'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update delivery');
      }

      // Update local state
      setJobs(prev => prev.filter(job => job.id !== selectedJob.id));
      setIsDeliveryModalOpen(false);
      toast.success('Delivery completed successfully');
    } catch (err) {
      console.error('Error saving delivery:', err);
      setError(err instanceof Error ? err.message : 'Failed to save delivery');
      toast.error('Failed to save delivery details');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      'ready_for_delivery': 'bg-green-100 text-green-800',
      'pending_approval': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-blue-100 text-blue-800',
      'completed': 'bg-purple-100 text-purple-800',
      'default': 'bg-gray-100 text-gray-800'
    };

    const normalizedStatus = status.toLowerCase().replace(/ /g, '_');
    return statusMap[normalizedStatus] || statusMap.default;
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
        <h1 className="text-2xl font-bold">Ready for Delivery Jobs</h1>
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
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(job.status)}`}>
                        {job.status ? job.status.replace(/_/g, ' ') : 'unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleJobSelect(job.id)}
                        className="text-green-600 hover:text-green-900 font-medium"
                        disabled={isFetchingDetails && selectedJob?.id === job.id}
                      >
                        {isFetchingDetails && selectedJob?.id === job.id ? (
                          <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 inline" />
                        ) : (
                          'Mark as Delivered'
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    {isLoading ? (
                      <Loader2 className="animate-spin h-5 w-5 inline mr-2" />
                    ) : (
                      'No jobs ready for delivery'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DeliveryModal
        isOpen={isDeliveryModalOpen}
        onClose={() => setIsDeliveryModalOpen(false)}
        job={selectedJob}
        inspection={selectedInspection}
        quotation={selectedQuotation}
        approval={selectedApproval}
        onSave={handleSaveDelivery}
        isLoading={isLoading || isFetchingDetails}
      />
    </div>
  );
};

export default ReadyForDelivery;