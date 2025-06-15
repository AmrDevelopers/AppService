import React, { useState } from 'react';
import axios from 'axios';

interface Props {
  job: {
    id: number;
    job_number: string;
    customer_name: string;
    status: string;
  };
  onClose: () => void;
  onSave: () => void;
}

const EditJobModal: React.FC<Props> = ({ job, onClose, onSave }) => {
  const [customerName, setCustomerName] = useState(job.customer_name);
  const [status, setStatus] = useState(job.status);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await axios.put(`/api/jobs/${job.id}`, {
        customer_name: customerName,
        status,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      onSave();
    } catch (error) {
      console.error('Failed to update job:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Edit Job #{job.job_number}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Customer Name</label>
            <input
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {Object.keys(statusTitles).map((key) => (
                <option key={key} value={key}>{statusTitles[key as keyof typeof statusTitles]}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditJobModal;
