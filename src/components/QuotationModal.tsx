import React, { useState, useEffect } from 'react';
import { Calendar, FileText, User, UserCheck, Loader2, X, Eye } from 'lucide-react';
import QuotationPreview from './QuotationPreview';

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
  const [showPreview, setShowPreview] = useState(false);

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
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold">Create Quotation</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-gray-600 hover:text-gray-800 px-3 py-1 rounded-md border border-gray-300 flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              disabled={isSubmitting}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
          </div>
        ) : (
          <div className="space-y-6">
            {showPreview ? (
              <QuotationPreview
                job={job}
                inspection={inspection}
                quotationData={quotationData}
              />
            ) : (
              <>
                {/* Job Details Section */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Job Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="font-medium capitalize">
                        {job.status ? job.status.replace(/_/g, ' ') : 'unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Created On</p>
                      <p className="font-medium">
                        {new Date(job.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Inspection Details Section */}
                {inspection && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3">Inspection Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Inspected By</p>
                        <div className="flex items-center">
                          <UserCheck className="h-4 w-4 text-gray-400 mr-1" />
                          <p className="font-medium">{inspection.inspected_by}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Inspection Date</p>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                          <p className="font-medium">
                            {new Date(inspection.inspection_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {inspection.problems_found && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">Problems Found</p>
                        <div className="mt-1 p-3 bg-white rounded border border-gray-200">
                          <p className="whitespace-pre-line text-sm">
                            {inspection.problems_found}
                          </p>
                        </div>
                      </div>
                    )}

                    {inspection.notes && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">Technician Notes</p>
                        <div className="mt-1 p-3 bg-white rounded border border-gray-200">
                          <p className="whitespace-pre-line text-sm">
                            {inspection.notes}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Spare Parts Section */}
                {inspection?.spare_parts && inspection.spare_parts.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3">Recommended Parts</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Part Name
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Qty
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Unit Price
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                          <tr className="bg-gray-50 font-medium">
                            <td colSpan={3} className="px-4 py-2 text-right">Total Parts Cost:</td>
                            <td className="px-4 py-2 text-right">
                              {formatCurrency(inspection.total_cost)}
                            </td>
                          </tr>
                        </tbody>
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
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotationModal;