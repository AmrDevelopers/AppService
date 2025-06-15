// File: src/pages/EditJob.tsx
import React, { useState, useEffect } from 'react'; // ✅ Import useState and useEffect
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { Loader2, AlertCircle } from 'lucide-react';

// Define the interface for the Job data based on the backend response
interface Job {
  id: number;
  job_number: string;
  customer_id: number;
  taken_by: string;
  remark?: string;
  scale_make?: string;
  scale_model?: string;
  scale_serial?: string;
  status: string;
  created_at: string;
  updated_at: string;
  quotation_number?: string;
  quotation_amount?: number;
  lpo_number?: string;
  approved_by?: string;
  approval_date?: string;
  inspection_problems?: string;
  inspected_by?: string;
  inspection_date?: string;
  delivery_date?: string;
  delivered_by?: string;
  invoice_number?: string;
  invoice_amount?: number;
  invoice_date?: string;
  // Fields from customer join
  customer_name: string;
  customer_phone?: string;
  contact_person?: string;
}

// Define the type for the form state
interface JobFormData {
  remark: string;
  scale_make: string;
  scale_model: string;
  scale_serial: string;
  status: string; // Assuming status can be edited via this form
  // Add other editable fields here
}


function EditJob() {
  const { id } = useParams<{ id: string }>();
  const jobId = id; // Use jobId for clarity

  // Fetch job data using react-query
  const {
    data: job,
    isLoading,
    isError,
    error,
  } = useQuery<Job, AxiosError>({
    queryKey: ['job', jobId], // Unique query key including the job ID
    queryFn: async () => {
      if (!jobId) {
        throw new Error('Job ID is missing');
      }
      const response = await axios.get(`/api/jobs/${jobId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    },
    enabled: !!jobId, // Only run the query if jobId is available
    staleTime: 1000 * 60 * 5, // Data is considered fresh for 5 minutes
  });

  // ✅ Add state for form data
  const [formData, setFormData] = useState<JobFormData>({
    remark: '',
    scale_make: '',
    scale_model: '',
    scale_serial: '',
    status: '',
    // Initialize other fields here
  });

  // ✅ Use useEffect to populate form data when job data is loaded
  useEffect(() => {
    if (job) {
      setFormData({
        remark: job.remark || '',
        scale_make: job.scale_make || '',
        scale_model: job.scale_model || '',
        scale_serial: job.scale_serial || '',
        status: job.status,
        // Populate other fields from job data
      });
    }
  }, [job]); // Dependency array includes job, so this runs when job data changes


  // ✅ Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  // ✅ Handle form submission (placeholder)
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // TODO: Add logic here to send updated data to the backend
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error.response?.data?.message || 'Failed to load job details'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If data is loaded, display the form
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Job: {job?.job_number}</h1>

      {job ? (
        // ✅ Replace the display div with a form
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Job Details</h2>

          {/* Display non-editable fields */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Job Number</label>
            <p className="mt-1 text-sm text-gray-900">{job.job_number}</p>
          </div>
           <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Customer Name</label>
            <p className="mt-1 text-sm text-gray-900">{job.customer_name}</p>
          </div>
           {/* Add other non-editable fields like customer phone, contact person if needed */}


          {/* Editable fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="scale_make" className="block text-sm font-medium text-gray-700">Scale Make</label>
              <input
                type="text"
                name="scale_make"
                id="scale_make"
                value={formData.scale_make}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
             <div>
              <label htmlFor="scale_model" className="block text-sm font-medium text-gray-700">Scale Model</label>
              <input
                type="text"
                name="scale_model"
                id="scale_model"
                value={formData.scale_model}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
             <div>
              <label htmlFor="scale_serial" className="block text-sm font-medium text-gray-700">Scale Serial</label>
              <input
                type="text"
                name="scale_serial"
                id="scale_serial"
                value={formData.scale_serial}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
             <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
              {/* You might want to restrict status changes based on workflow */}
              <select
                name="status"
                id="status"
                value={formData.status}
                onChange={handleInputChange}
                 className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {/* Add status options here based on your workflow */}
                <option value="pending_inspection">Pending Inspection</option>
                <option value="pending_quotation">Pending Quotation</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="ready_for_delivery">Ready for Delivery</option>
                <option value="delivered">Delivered</option>
                {/* Add other relevant statuses */}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="remark" className="block text-sm font-medium text-gray-700">Remark</label>
            <textarea
              name="remark"
              id="remark"
              rows={3}
              value={formData.remark}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            ></textarea>
          </div>

          {/* Add more editable fields as needed */}


          <div className="mt-6">
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        <p className="text-gray-500">No job data found.</p>
      )}
    </div>
  );
}

export default EditJob;
