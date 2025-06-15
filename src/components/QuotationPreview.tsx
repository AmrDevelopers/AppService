import React from 'react';
import { Calendar, FileText, User, ClipboardCheck } from 'lucide-react';

interface SparePart {
  id: number;
  part_name: string;
  quantity: number;
  unit_price: number;
}

interface Job {
  id: number;
  job_number: string;
  customer_id: number;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  scale_make?: string;
  scale_model?: string;
  scale_serial?: string;
}

interface Inspection {
  id: number;
  job_id: number;
  problems_found: string | null;
  inspected_by: string;
  inspection_date: string;
  notes: string | null;
  spare_parts: SparePart[];
  total_cost: number;
}

interface QuotationData {
  quotationNumber: string;
  quotationDate: string;
  amount: number;
}

interface QuotationPreviewProps {
  job: Job;
  inspection: Inspection | null;
  quotationData: QuotationData;
}

const QuotationPreview: React.FC<QuotationPreviewProps> = ({ 
  job, 
  inspection, 
  quotationData 
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 print:shadow-none">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-blue-700">QUOTATION</h1>
          <p className="text-gray-500">Reference: {quotationData.quotationNumber}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg">Your Company Name</p>
          <p className="text-gray-600">123 Scale Service Road</p>
          <p className="text-gray-600">Anytown, AN 12345</p>
          <p className="text-gray-600">Phone: (555) 123-4567</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <h2 className="font-bold mb-2 text-gray-700 flex items-center">
            <User className="h-4 w-4 mr-2" /> 
            Customer Details
          </h2>
          <div className="p-4 bg-gray-50 rounded border border-gray-200">
            <p className="font-medium">{job.customer_name}</p>
            {job.customer_phone && <p className="text-gray-600">{job.customer_phone}</p>}
            {job.customer_email && <p className="text-gray-600">{job.customer_email}</p>}
          </div>
        </div>
        
        <div>
          <h2 className="font-bold mb-2 text-gray-700 flex items-center">
            <Calendar className="h-4 w-4 mr-2" /> 
            Quotation Details
          </h2>
          <div className="p-4 bg-gray-50 rounded border border-gray-200">
            <div className="grid grid-cols-2 gap-2">
              <p className="text-gray-600">Date:</p>
              <p>{formatDate(quotationData.quotationDate)}</p>
              
              <p className="text-gray-600">Job Number:</p>
              <p>{job.job_number}</p>
              
              <p className="text-gray-600">Valid Until:</p>
              <p>{formatDate(
                new Date(
                  new Date(quotationData.quotationDate).setDate(
                    new Date(quotationData.quotationDate).getDate() + 30
                  )
                ).toISOString()
              )}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="font-bold mb-2 text-gray-700 flex items-center">
          <FileText className="h-4 w-4 mr-2" />
          Equipment Details
        </h2>
        <div className="p-4 bg-gray-50 rounded border border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {job.scale_make && (
              <div>
                <p className="text-gray-600">Make:</p>
                <p className="font-medium">{job.scale_make}</p>
              </div>
            )}
            {job.scale_model && (
              <div>
                <p className="text-gray-600">Model:</p>
                <p className="font-medium">{job.scale_model}</p>
              </div>
            )}
            {job.scale_serial && (
              <div>
                <p className="text-gray-600">Serial Number:</p>
                <p className="font-medium">{job.scale_serial}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {inspection?.problems_found && (
        <div className="mb-8">
          <h2 className="font-bold mb-2 text-gray-700 flex items-center">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Inspection Findings
          </h2>
          <div className="p-4 bg-gray-50 rounded border border-gray-200">
            <p className="whitespace-pre-line">{inspection.problems_found}</p>
          </div>
        </div>
      )}

      {inspection?.spare_parts && inspection.spare_parts.length > 0 && (
        <div className="mb-8">
          <h2 className="font-bold mb-2 text-gray-700">Recommended Parts & Services</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
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
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-8 border-t border-gray-200 pt-4">
        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between py-2 font-medium">
              <span>Subtotal:</span>
              <span>{formatCurrency(inspection?.total_cost || 0)}</span>
            </div>
            <div className="flex justify-between py-2 text-sm text-gray-600">
              <span>Tax (10%):</span>
              <span>{formatCurrency((inspection?.total_cost || 0) * 0.1)}</span>
            </div>
            <div className="flex justify-between py-2 font-bold text-lg border-t border-gray-200">
              <span>Total:</span>
              <span className="text-blue-700">{formatCurrency(quotationData.amount)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-sm text-gray-600">
        <p className="mb-2 font-medium">Terms & Conditions:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>This quotation is valid for 30 days from the issue date.</li>
          <li>Payment terms: 50% deposit required to commence work, balance due on completion.</li>
          <li>Estimated completion time: 7-10 business days from approval.</li>
          <li>Warranty: All parts and labor covered for 90 days after service completion.</li>
        </ul>
      </div>

      <div className="mt-8 text-center text-gray-600 text-sm">
        <p>Thank you for your business!</p>
      </div>
    </div>
  );
};

export default QuotationPreview;