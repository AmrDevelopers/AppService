import { useQuery } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { PackageCheck, CalendarDays, Search, Loader2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface Job {
  id: string;
  job_number: string;
  customer_name: string;
  contact_person: string;
  make: string;
  model: string;
  serial_number: string;
  invoice_number: string;
  invoice_amount: number;
  invoice_date: string;
  delivery_date: string;
  delivered_by: string;
  status: string;
}

export default function DeliveredJobs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Fetch delivered jobs with proper typing
  const { 
    data: jobs, 
    isLoading, 
    isError,
    error 
  } = useQuery<Job[], AxiosError>({
    queryKey: ['delivered-jobs'],
    queryFn: async () => {
      const response = await axios.get('/api/jobs?status=delivered', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  // Filter jobs based on search term and date
  const filteredJobs = jobs?.filter(job => {
    const matchesSearch = job.job_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.serial_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !dateFilter || 
      new Date(job.delivery_date).toISOString().split('T')[0] === dateFilter;
    
    return matchesSearch && matchesDate;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
                {error.response?.data?.message || 'Failed to load delivered jobs'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <PackageCheck className="w-6 h-6" />
          Delivered Jobs
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search jobs..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          <div className="relative">
            <input
              type="date"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CalendarDays className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredJobs?.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {job.job_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium">{job.customer_name}</div>
                    <div className="text-sm text-gray-500">{job.contact_person}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>{job.make} {job.model}</div>
                    <div className="text-sm text-gray-500">S/N: {job.serial_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>#{job.invoice_number}</div>
                    <div className="text-sm text-gray-500">
                      ${job.invoice_amount?.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDate(job.invoice_date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium">{formatDate(job.delivery_date)}</div>
                    {job.delivered_by && (
                      <div className="text-sm text-gray-500">By: {job.delivered_by}</div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredJobs?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    {jobs?.length === 0 ? (
                      'No delivered jobs found'
                    ) : (
                      'No jobs match your search criteria'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}