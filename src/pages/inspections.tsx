import React, { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { Wrench, X, Plus, ArrowLeft, ClipboardList, Loader2, Eye, Printer, Edit } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

interface SparePart {
  id?: string;
  part_name: string;
  quantity: number;
  unit_price: number;
  total?: number;
}

interface Job {
  id: string;
  job_number: string;
  customer_id: number;
  customer_name: string;
  contact_person: string;
  taken_by: string;
  remark: string;
  scale_make: string;
  scale_model: string;
  scale_serial: string;
  status: string;
  lpo_number: string;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

interface InspectionFormData {
  problems: string;
  inspectedBy: string;
  totalAmount: string;
  notes: string;
  inspectionDate: string;
}

interface Inspection {
  id: string;
  job_id: string;
  problems_found: string;
  inspected_by: string;
  inspection_date: string;
  total_amount: number;
  notes: string;
  spare_parts: SparePart[];
}

interface JobsApiResponse {
  success: boolean;
  data: Job[];
  count?: number;
}

interface InspectionsApiResponse {
  success: boolean;
  data: Inspection[];
  count?: number;
}

interface ApiError {
  message: string;
  [key: string]: any;
}

function JobPreviewModal({ job, onClose }: { job: Job; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold">Job Details #{job.job_number}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Customer Information</h3>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Customer ID:</span> {job.customer_id}
              </p>
              <p className="text-sm">
                <span className="font-medium">Customer Name:</span> {job.customer_name}
              </p>
              <p className="text-sm">
                <span className="font-medium">Contact Person:</span> {job.contact_person}
              </p>
              <p className="text-sm">
                <span className="font-medium">LPO Number:</span> {job.lpo_number || 'N/A'}
              </p>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Scale Information</h3>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Make:</span> {job.scale_make || 'N/A'}
              </p>
              <p className="text-sm">
                <span className="font-medium">Model:</span> {job.scale_model || 'N/A'}
              </p>
              <p className="text-sm">
                <span className="font-medium">Serial Number:</span> {job.scale_serial || 'N/A'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <h3 className="font-medium text-gray-900 mb-2">Job Information</h3>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Taken By:</span> {job.taken_by}
            </p>
            <p className="text-sm">
              <span className="font-medium">Status:</span>{' '}
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                {job.status.replace(/_/g, ' ')}
              </span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Created:</span> {format(new Date(job.created_at), 'PPpp')}
            </p>
            {job.approved_at && (
              <p className="text-sm">
                <span className="font-medium">Approved:</span> {format(new Date(job.approved_at), 'PPpp')}
              </p>
            )}
          </div>
        </div>
        
        {job.remark && (
          <div className="mt-4">
            <h3 className="font-medium text-gray-900 mb-2">Remarks</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{job.remark}</p>
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function Inspections() {
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [previewJob, setPreviewJob] = useState<Job | null>(null);
  const [selectedJobForPrint, setSelectedJobForPrint] = useState<Job | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [existingInspection, setExistingInspection] = useState<Inspection | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  
  const [inspectionData, setInspectionData] = useState<InspectionFormData>({
    problems: '',
    inspectedBy: '',
    totalAmount: '0',
    notes: '',
    inspectionDate: new Date().toISOString().split('T')[0]
  });
  
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [newSparePart, setNewSparePart] = useState({
    name: '',
    quantity: '1',
    price: '0'
  });

  const {
    data: jobsResponse,
    isLoading,
    error: jobsError,
  } = useQuery<JobsApiResponse, AxiosError<ApiError>>({
    queryKey: ['jobs-for-inspection'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/jobs/inspections', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
  });

  const {
    data: inspectionsResponse,
  } = useQuery<InspectionsApiResponse, AxiosError<ApiError>>({
    queryKey: ['inspections'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/jobs/inspections/list', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
  });

  const jobs = useMemo(() => {
    return jobsResponse?.data || [];
  }, [jobsResponse]);

  const inspections = useMemo(() => {
    return inspectionsResponse?.data || [];
  }, [inspectionsResponse]);

  const totalAmount = useMemo(() => {
    return spareParts.reduce((sum, part) => sum + (part.total || 0), 0);
  }, [spareParts]);

  React.useEffect(() => {
    setInspectionData(prev => ({
      ...prev,
      totalAmount: totalAmount.toFixed(2)
    }));
  }, [totalAmount]);

  const submitInspectionMutation = useMutation<
    Inspection,
    AxiosError<ApiError>,
    { jobId: string; inspectionData: InspectionFormData; spareParts: SparePart[] }
  >({
    mutationFn: async ({ jobId, inspectionData, spareParts }) => {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/jobs/inspections`, {
        job_id: jobId,
        problems_found: inspectionData.problems,
        inspected_by: inspectionData.inspectedBy,
        inspection_date: inspectionData.inspectionDate,
        total_amount: parseFloat(inspectionData.totalAmount),
        spare_parts: spareParts.map((part) => ({
          part_name: part.part_name,
          quantity: part.quantity,
          unit_price: part.unit_price
        })),
        notes: inspectionData.notes
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Inspection submitted successfully! Job moved to Quotation Page.');
      queryClient.invalidateQueries({ queryKey: ['jobs-for-inspection'] });
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      resetForm();
    },
    onError: (error: AxiosError<ApiError>) => {
      const serverMessage = error.response?.data?.message || error.message;
      toast.error(`Failed to submit inspection: ${serverMessage}`);
      console.error('Submission error:', error);
    }
  });

  const updateInspectionMutation = useMutation<
    Inspection,
    AxiosError<ApiError>,
    { inspectionId: string; jobId: string; inspectionData: InspectionFormData; spareParts: SparePart[] }
  >({
    mutationFn: async ({ inspectionId, jobId, inspectionData, spareParts }) => {
      const token = localStorage.getItem('token');
      const response = await axios.put(`/api/jobs/inspections/${inspectionId}`, {
        job_id: jobId,
        problems_found: inspectionData.problems,
        inspected_by: inspectionData.inspectedBy,
        inspection_date: inspectionData.inspectionDate,
        total_amount: parseFloat(inspectionData.totalAmount),
        spare_parts: spareParts.map((part) => ({
          part_name: part.part_name,
          quantity: part.quantity,
          unit_price: part.unit_price
        })),
        notes: inspectionData.notes
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Inspection updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['jobs-for-inspection'] });
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      resetForm();
    },
    onError: (error: AxiosError<ApiError>) => {
      const serverMessage = error.response?.data?.message || error.message;
      toast.error(`Failed to update inspection: ${serverMessage}`);
      console.error('Update error:', error);
    }
  });

  const handlePrint = (job: Job) => {
    setSelectedJobForPrint(job);
    
    setTimeout(() => {
      const printContents = printRef.current?.innerHTML;
      if (!printContents) return;

      const printWindow = window.open('', '_blank', 'width=58mm,height=39mm');
      if (!printWindow) {
        toast.error('Please allow popups for printing');
        return;
      }

      printWindow.document.open();
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Job Receipt</title>
            <style>
              @page {
                size: 58mm 39mm;
                margin: 0;
                padding: 0;
              }
              body {
                margin: 0 !important;
                padding: 0 !important;
                width: 58mm !important;
                height: 39mm !important;
                font-family: Arial, sans-serif;
              }
              #receipt-content {
                width: 58mm !important;
                min-height: 39mm !important;
                height: auto !important;
                padding: 2mm !important;
                margin: 0 !important;
                font-size: 9pt;
                line-height: 1.1;
              }
            </style>
          </head>
          <body>
            ${printContents}
            <script>
              setTimeout(function() {
                window.print();
                window.close();
              }, 200);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }, 100);
  };

  const handleEditInspection = async (jobId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/jobs/inspections/${jobId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const inspection = response.data.data;
      setExistingInspection(inspection);
      setEditMode(true);
      
      setInspectionData({
        problems: inspection.problems_found,
        inspectedBy: inspection.inspected_by,
        totalAmount: inspection.total_amount.toString(),
        notes: inspection.notes,
        inspectionDate: inspection.inspection_date.split('T')[0]
      });
      
      setSpareParts(inspection.spare_parts || []);
      
      const jobToEdit = jobsResponse?.data.find(j => j.id === inspection.job_id);
      if (jobToEdit) {
        setSelectedJob(jobToEdit);
      }
    } catch (error) {
      toast.error('Failed to load inspection for editing');
      console.error('Error loading inspection:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInspectionData(prev => ({ ...prev, [name]: value }));
  };

  const handleSparePartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewSparePart(prev => ({ 
      ...prev, 
      [name]: name === 'name' ? value : value.replace(/[^0-9.]/g, '')
    }));
  };

  const addSparePart = () => {
    if (!newSparePart.name.trim()) {
      toast.error('Please enter a part name');
      return;
    }
  
    const part: SparePart = {
      id: Math.random().toString(36).substr(2, 9),
      part_name: newSparePart.name.trim(),
      quantity: Number(newSparePart.quantity) || 1,
      unit_price: Number(newSparePart.price) || 0,
      total: Number(newSparePart.price) * (Number(newSparePart.quantity) || 1)
    };
  
    setSpareParts(prev => [...prev, part]);
    setNewSparePart({ name: '', quantity: '1', price: '0' });
  };

  const removeSparePart = (id?: string) => {
    if (!id) return;
    setSpareParts(prev => prev.filter(part => part.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    if (!inspectionData.problems.trim() || !inspectionData.inspectedBy.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    const payload = {
      jobId: selectedJob.id,
      inspectionData,
      spareParts
    };

    if (editMode && existingInspection) {
      updateInspectionMutation.mutate({
        inspectionId: existingInspection.id,
        ...payload
      });
    } else {
      submitInspectionMutation.mutate(payload);
    }
  };

  const resetForm = () => {
    setSelectedJob(null);
    setEditMode(false);
    setExistingInspection(null);
    setInspectionData({
      problems: '',
      inspectedBy: '',
      totalAmount: '0',
      notes: '',
      inspectionDate: new Date().toISOString().split('T')[0]
    });
    setSpareParts([]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (jobsError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Failed to load jobs: {jobsError.response?.data?.message || jobsError.message}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <ClipboardList className="w-6 h-6" />
        Jobs Pending Inspection
      </h1>

      {/* Hidden receipt div for printing */}
      <div className="hidden" ref={printRef}>
        {selectedJobForPrint && (
          <div 
            id="receipt-content"
            style={{
              width: '58mm',
              height: '39mm',
              padding: '2mm',
              fontFamily: 'monospace',
              fontSize: '12pt',
              lineHeight: '1.2',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', marginBottom: '1mm' }}>
              <div style={{ width: '20mm' }}>Date:</div>
              <div>{format(new Date(selectedJobForPrint.created_at), 'PP')}</div>
            </div>

            <div style={{ display: 'flex', marginBottom: '1mm' }}>
              <div style={{ width: '20mm' }}>Job N0.:</div>
              <div>{selectedJobForPrint.job_number}</div>
            </div>

            <div style={{ display: 'flex', marginBottom: '1mm' }}>
              <div style={{ width: '20mm' }}>Customer:</div>
              <div style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '35mm'
              }}>
                {selectedJobForPrint.customer_name}
              </div>
            </div>

            <div style={{ display: 'flex' }}>
              <div style={{ width: '20mm' }}>Taken:</div>
              <div>{selectedJobForPrint.taken_by}</div>
            </div>
          </div>
        )}
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          @page {
            size: 58mm 39mm;
            margin: 0;
          }

          html, body {
            width: 58mm !important;
            height: 39mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }

          #receipt-content {
            width: 58mm !important;
            height: 39mm !important;
            padding: 2mm !important;
            font-family: monospace !important;
            font-size: 8pt !important;
            line-height: 1.2 !important;
            box-sizing: border-box;
            overflow: hidden !important;
          }
        }
      `}</style>

      {!selectedJob ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobs.length > 0 ? (
                  jobs.map((job) => {
                    const hasInspection = inspections.some(i => i.job_id === job.id);
                    
                    return (
                      <tr key={job.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(job.created_at), 'PP')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {job.job_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {job.customer_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            {job.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => setPreviewJob(job)}
                              className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              Preview
                            </button>
                            <button
                              onClick={() => handlePrint(job)}
                              className="text-purple-600 hover:text-purple-900 flex items-center gap-1"
                            >
                              <Printer className="w-4 h-4" />
                              Print
                            </button>
                            {hasInspection ? (
                              <button
                                onClick={() => handleEditInspection(job.id)}
                                className="text-green-600 hover:text-green-900 flex items-center gap-1"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </button>
                            ) : (
                              <button
                                onClick={() => setSelectedJob(job)}
                                className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                              >
                                <Wrench className="w-4 h-4" />
                                Inspect
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      No jobs pending inspection
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-semibold">
              {editMode ? 'Edit Inspection' : 'New Inspection'} for Job #{selectedJob.job_number}
            </h2>
            <button 
              className="text-gray-500 hover:text-gray-700 flex items-center gap-2"
              onClick={resetForm}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to list
            </button>
          </div>
          
          <div className="mb-6 space-y-2">
            <p className="text-gray-600">
              <span className="font-medium">Customer:</span> {selectedJob.customer_name}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Make/Model:</span> {selectedJob.scale_make} {selectedJob.scale_model}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Serial Number:</span> {selectedJob.scale_serial}
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="problems" className="block text-sm font-medium text-gray-700 mb-1">
                  Problems Found *
                </label>
                <textarea
                  id="problems"
                  name="problems"
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    !inspectionData.problems && (submitInspectionMutation.isError || updateInspectionMutation.isError) 
                      ? 'border-red-500' 
                      : 'border-gray-300'
                  }`}
                  value={inspectionData.problems}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="inspectedBy" className="block text-sm font-medium text-gray-700 mb-1">
                    Inspected By *
                  </label>
                  <input
                    type="text"
                    id="inspectedBy"
                    name="inspectedBy"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      !inspectionData.inspectedBy && (submitInspectionMutation.isError || updateInspectionMutation.isError)
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                    value={inspectionData.inspectedBy}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 mb-1">
                    Total Amount
                  </label>
                  <input
                    type="text"
                    id="totalAmount"
                    name="totalAmount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 focus:outline-none"
                    value={`AED ${inspectionData.totalAmount}`}
                    readOnly
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Spare Parts</h3>
                
                {spareParts.length > 0 && (
                  <div className="mb-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {spareParts.map((part) => (
                          <tr key={part.id || part.part_name}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{part.part_name}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{part.quantity}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">AED {part.unit_price.toFixed(2)}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">AED {((part.unit_price || 0) * (part.quantity || 0)).toFixed(2)}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                              <button
                                type="button"
                                onClick={() => removeSparePart(part.id)}
                                className="text-red-600 hover:text-red-900 flex items-center gap-1"
                              >   
                                <X className="w-4 h-4" />
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label htmlFor="sparePartName" className="block text-sm font-medium text-gray-700 mb-1">
                      Part Name
                    </label>
                    <input
                      type="text"
                      id="sparePartName"
                      name="name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={newSparePart.name}
                      onChange={handleSparePartChange}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="sparePartQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      id="sparePartQuantity"
                      name="quantity"
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={newSparePart.quantity}
                      onChange={handleSparePartChange}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="sparePartPrice" className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Price (AED)
                    </label>
                    <input
                      type="number"
                      id="sparePartPrice"
                      name="price"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={newSparePart.price}
                      onChange={handleSparePartChange}
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={addSparePart}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center gap-2"
                      disabled={!newSparePart.name}
                    >
                      <Plus className="w-4 h-4" />
                      Add Part
                    </button>
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  id="notes"
      name="notes"
      rows={2}
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      value={inspectionData.notes}
      onChange={handleInputChange}
    />
  </div>
</div>

<div className="mt-6 flex justify-end space-x-3">
  <button
    type="button"
    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2"
    onClick={resetForm}
    disabled={submitInspectionMutation.isPending || updateInspectionMutation.isPending}
  >
    <X className="w-4 h-4" />
    Cancel
  </button>
  <button
    type="submit"
    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2"
    disabled={submitInspectionMutation.isPending || updateInspectionMutation.isPending}
  >
    {submitInspectionMutation.isPending || updateInspectionMutation.isPending ? (
      <Loader2 className="w-4 h-4 animate-spin" />
    ) : (
      <Wrench className="w-4 h-4" />
    )}
    {submitInspectionMutation.isPending || updateInspectionMutation.isPending 
      ? 'Submitting...' 
      : editMode 
        ? 'Update Inspection' 
        : 'Submit Inspection'}
  </button>
</div>
</form>
</div>
)}

{previewJob && (
  <JobPreviewModal 
    job={previewJob} 
    onClose={() => setPreviewJob(null)} 
  />
)}
</div>
);
}

export default Inspections;