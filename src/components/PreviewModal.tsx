import React from 'react';
import { X } from 'lucide-react';

interface SparePart {
  id: number;
  part_name: string;
  quantity: number;
  unit_price: string;
}

interface Inspection {
  id: number;
  problems_found: string;
  inspected_by: string;
  inspection_date: string;
  spare_parts: SparePart[];
  total_cost: number;
}

interface Job {
  id: string;
  job_number: string;
  customer_name: string;
  contact_person: string;
  make: string;
  model: string;
  serial_number: string;
  quotation_number: string;
  quotation_amount: number;
  status: string;
}

interface PreviewModalProps {
  job: Job;
  inspection: Inspection | null;
  onClose: () => void;
  isLoading?: boolean;
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  job,
  inspection,
  onClose,
  isLoading = false
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-red-600"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold mb-4">Job Preview</h2>

        {isLoading ? (
          <p className="text-gray-500">Loading details...</p>
        ) : (
          <div className="space-y-6">
            {/* Job Info */}
            <section>
              <h3 className="text-lg font-semibold mb-2">Job Details</h3>
              <p><strong>Job #:</strong> {job.job_number}</p>
              <p><strong>Customer:</strong> {job.customer_name}</p>
              <p><strong>Contact:</strong> {job.contact_person}</p>
              <p><strong>Make / Model:</strong> {job.make} / {job.model}</p>
              <p><strong>Serial Number:</strong> {job.serial_number}</p>
              <p><strong>Status:</strong> {job.status}</p>
            </section>

            {/* Quotation */}
            <section>
              <h3 className="text-lg font-semibold mb-2">Quotation</h3>
              <p><strong>Quotation #:</strong> {job.quotation_number}</p>
              <p><strong>Amount:</strong> ${job.quotation_amount?.toLocaleString()}</p>
            </section>

            {/* Inspection Info */}
            {inspection && (
              <section>
                <h3 className="text-lg font-semibold mb-2">Inspection</h3>
                <p><strong>Inspected By:</strong> {inspection.inspected_by}</p>
                <p><strong>Inspection Date:</strong> {inspection.inspection_date}</p>
                <p><strong>Problems Found:</strong> {inspection.problems_found}</p>

                {/* Spare Parts */}
                {inspection.spare_parts?.length > 0 && (
                  <>
                    <h4 className="text-md font-medium mt-4">Spare Parts</h4>
                    <table className="min-w-full mt-2 text-sm text-left border border-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 border">Part Name</th>
                          <th className="px-4 py-2 border">Quantity</th>
                          <th className="px-4 py-2 border">Unit Price</th>
                          <th className="px-4 py-2 border">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inspection.spare_parts.map(part => (
                          <tr key={part.id}>
                            <td className="px-4 py-2 border">{part.part_name}</td>
                            <td className="px-4 py-2 border">{part.quantity}</td>
                            <td className="px-4 py-2 border">${parseFloat(part.unit_price).toFixed(2)}</td>
                            <td className="px-4 py-2 border">
                              ${(part.quantity * parseFloat(part.unit_price)).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                        <tr>
                          <td colSpan={3} className="px-4 py-2 text-right font-semibold border">Total Cost:</td>
                          <td className="px-4 py-2 border font-bold">
                            ${inspection.total_cost.toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewModal;
