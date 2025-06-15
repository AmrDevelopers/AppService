import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus, Search, X, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface Customer {
  id: number;
  name: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
}

interface JobFormData {
  customerId: number;
  make: string;
  model: string;
  serialNumber: string;
  remark: string;
  takenBy: string;
}

interface CustomerFormData {
  name: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
}

interface JobReceiptData {
  date: string;
  jobNumber: string;
  customerName: string;
  takenBy: string;
}

const JobCreation: React.FC = () => {
  const [selectedJob, setSelectedJob] = useState<JobReceiptData | null>(null);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [focusedCustomerIndex, setFocusedCustomerIndex] = useState<number>(-1);
  const customerDropdownRef = useRef<HTMLUListElement>(null);

  const { 
    register, 
    handleSubmit, 
    reset, 
    setValue,
    formState: { errors } 
  } = useForm<JobFormData>();

  const { 
    register: registerCustomer, 
    handleSubmit: handleSubmitCustomer, 
    reset: resetCustomer,
    formState: { errors: customerErrors } 
  } = useForm<CustomerFormData>();

  const { data: allCustomers = [], refetch: refetchCustomers, isLoading: isCustomersLoading } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      try {
        const response = await axios.get('/api/customers', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        return Array.isArray(response.data) ? response.data : response.data.data || [];
      } catch (error) {
        toast.error('Failed to load customers');
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const filteredCustomers = allCustomers.filter((customer: Customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const createJobMutation = useMutation({
    mutationFn: async (data: JobFormData) => {
      if (!selectedCustomer) {
        throw new Error('No customer selected');
      }

      const jobData = {
        customer_id: selectedCustomer.id,
        taken_by: data.takenBy,
        remark: data.remark,
        make: data.make,
        model: data.model,
        serial_number: data.serialNumber
      };

      const response = await axios.post(`/api/jobs`, jobData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      console.log('Job creation response:', data);
      
      // Extract job number
      let jobNumber = '';
      if (data && typeof data === 'object') {
        jobNumber = data.job_number || data.jobNumber || 
                  (data.job && data.job.job_number) || 
                  (data.data && data.data.job_number) || 
                  `JOB-${new Date().getTime()}`;
      }
      
      const receiptData = {
        date: new Date().toLocaleDateString(),
        jobNumber: jobNumber,
        customerName: selectedCustomer?.name || '',
        takenBy: variables.takenBy
      };
      
      setSelectedJob(receiptData);
      reset();
      toast.success('Job created successfully');
    },
    onError: (error) => {
      console.error('Job creation error:', error);
      toast.error('Failed to create job');
    }
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const response = await axios.post(`/api/customers`, {
        name: data.name,
        address: data.address,
        contactPerson: data.contactPerson,
        phone: data.phone,
        email: data.email
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      refetchCustomers();
      setIsAddingCustomer(false);
      resetCustomer();
      setSelectedCustomer(data);
      setValue('customerId', data.id);
      setSearchTerm(data.name);
      toast.success('Customer added successfully');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.sqlMessage || 
                          'Failed to add customer';
      toast.error(errorMessage);
    }
  });

  

  const onSubmit = (data: JobFormData) => {
    if (!selectedCustomer) {
      toast.error('Please select a customer before submitting.');
      return;
    }
    createJobMutation.mutate(data);
  };

  const onCustomerSubmit = (data: CustomerFormData) => {
    if (!data.name || !data.contactPerson || !data.phone) {
      toast.error('Name, contact person, and phone are required');
      return;
    }
    createCustomerMutation.mutate(data);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showCustomerDropdown) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedCustomerIndex(prev => 
        Math.min(prev + 1, filteredCustomers.length - 1)
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedCustomerIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && focusedCustomerIndex >= 0) {
      e.preventDefault();
      handleCustomerSelect(filteredCustomers[focusedCustomerIndex]);
    } else if (e.key === 'Escape') {
      setShowCustomerDropdown(false);
    }
  };

  useEffect(() => {
    if (focusedCustomerIndex >= 0 && customerDropdownRef.current) {
      const items = customerDropdownRef.current.querySelectorAll('li');
      if (items[focusedCustomerIndex]) {
        items[focusedCustomerIndex].scrollIntoView({
          block: 'nearest'
        });
      }
    }
  }, [focusedCustomerIndex]);

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setValue('customerId', customer.id);
    setSearchTerm(customer.name);
    setShowCustomerDropdown(false);
    setFocusedCustomerIndex(-1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowCustomerDropdown(value.length > 0);
    setFocusedCustomerIndex(-1);
    if (!value) {
      setSelectedCustomer(null);
    }
  };

  const clearCustomerSelection = () => {
    setSelectedCustomer(null);
    setSearchTerm('');
    setValue('customerId', 0);
    setShowCustomerDropdown(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.customer-search-container')) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Job Creation</h1>
        </div>

        {isAddingCustomer ? (
          <form onSubmit={handleSubmitCustomer(onCustomerSubmit)} className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Customer</h2>
            
            <div className="space-y-4">
              {[
                { name: 'name', label: 'Customer Name', required: true },
                { name: 'address', label: 'Address', required: true, textarea: true },
                { name: 'contactPerson', label: 'Contact Person', required: true },
                { name: 'phone', label: 'Phone', required: true },
                { name: 'email', label: 'Email', required: false }
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label} {field.required && '*'}
                  </label>
                  {field.textarea ? (
                    <textarea
                      {...registerCustomer(field.name as keyof CustomerFormData, { required: field.required })}
                      rows={3}
                      className={`block w-full rounded-md border border-black shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                        customerErrors[field.name as keyof CustomerFormData] ? 'border-red-500' : ''
                      }`}
                    />
                  ) : (
                    <input
                      type={field.name === 'email' ? 'email' : 'text'}
                      {...registerCustomer(field.name as keyof CustomerFormData, { required: field.required })}
                      className={`block w-full rounded-md border border-black shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                        customerErrors[field.name as keyof CustomerFormData] ? 'border-red-500' : ''
                      }`}
                    />
                  )}
                  {customerErrors[field.name as keyof CustomerFormData] && (
                    <p className="mt-1 text-sm text-red-600">This field is required</p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setIsAddingCustomer(false);
                  resetCustomer();
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
                disabled={createCustomerMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createCustomerMutation.isPending}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {createCustomerMutation.isPending && <Loader2 className="w-5 h-5 animate-spin" />}
                Add Customer
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="relative customer-search-container">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setShowCustomerDropdown(searchTerm.length > 0)}
                      className="block w-full rounded-md border border-black pl-10 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Search customers..."
                    />
                    {selectedCustomer && (
                      <button
                        type="button"
                        onClick={clearCustomerSelection}
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                      >
                        <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomer(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <Plus className="w-5 h-5" />
                    New
                  </button>
                </div>

                {showCustomerDropdown && (
                  <ul 
                    ref={customerDropdownRef}
                    className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
                  >
                    {isCustomersLoading ? (
                      <li className="py-2 text-center">
                        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                      </li>
                    ) : filteredCustomers.length > 0 ? (
                      filteredCustomers.map((customer, index) => (
                        <li
                          key={customer.id}
                          className={`relative cursor-default select-none py-2 pl-3 pr-9 ${
                            index === focusedCustomerIndex 
                              ? 'bg-blue-100 text-blue-900' 
                              : 'hover:bg-blue-100'
                          }`}
                          onClick={() => handleCustomerSelect(customer)}
                        >
                          <div className="flex items-center">
                            <span className="font-normal truncate">
                              {customer.name} 
                              {customer.contactPerson ? ` (${customer.contactPerson})` : ''}
                            </span>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="py-2 text-center text-gray-500">
                        No customers found
                      </li>
                    )}
                  </ul>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'make', label: 'Make' },
                  { name: 'model', label: 'Model' }
                ].map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label} *
                    </label>
                    <input
                      type="text"
                      {...register(field.name as 'make' | 'model', { required: true })}
                      className={`block w-full rounded-md border border-black shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                        errors[field.name as 'make' | 'model'] ? 'border-red-500' : ''
                      }`}
                    />
                    {errors[field.name as 'make' | 'model'] && (
                      <p className="mt-1 text-sm text-red-600">This field is required</p>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serial Number *
                </label>
                <input
                  type="text"
                  {...register('serialNumber', { required: true })}
                  className={`block w-full rounded-md border border-black shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    errors.serialNumber ? 'border-red-500' : ''
                  }`}
                />
                {errors.serialNumber && (
                  <p className="mt-1 text-sm text-red-600">This field is required</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Taken By *
                </label>
                <input
                  type="text"
                  {...register('takenBy', { required: true })}
                  className={`block w-full rounded-md border border-black shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    errors.takenBy ? 'border-red-500' : ''
                  }`}
                />
                {errors.takenBy && (
                  <p className="mt-1 text-sm text-red-600">This field is required</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remark
                </label>
                <textarea
                  {...register('remark')}
                  rows={3}
                  className="block w-full rounded-md border border-black shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  reset();
                  setSelectedCustomer(null);
                  setSearchTerm('');
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 mr-4"
                disabled={createJobMutation.isPending}
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={createJobMutation.isPending}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {createJobMutation.isPending && <Loader2 className="w-5 h-5 animate-spin" />}
                Save Job
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default JobCreation;