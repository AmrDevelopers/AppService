import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus, Loader2, Calendar as CalendarIcon, Search, X, Mail, Bell, BellOff, Edit } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { format, addYears } from 'date-fns';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

type CustomerFormData = {
  name: string;
  address: string;
  contactPerson: string;
  phone: string;
  email?: string;
};

type Job = {
  id: number;
  job_number: string;
  date: string;
  job_type: 'ACCREDITED' | 'NON-ACCREDITED';
  customer_id: number;
  customer_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  notifications_enabled?: boolean;
};

// Update your Certificate type first
type Certificate = {
  id: number;
  job_request_id: number;
  certificate_number: string;
  date_of_calibration: string;
  calibration_due_date: string;
  customer_name: string;
  equipment_details: string;
  location: string;
  notification_sent: boolean;
  make: string | null;
  model: string | null;
  capacity: string | null;
  serial_no: string | null;
  asset_no: string | null;
  created_at?: string;
  updated_at?: string;
};

export default function CalibrationJobRequest() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [jobType, setJobType] = useState("accredited");
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [customerId, setCustomerId] = useState<number | "">("");
  const [jobNumber, setJobNumber] = useState<string>("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'jobRequest' | 'certificates'>('jobRequest');
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingCertificate, setEditingCertificate] = useState<Partial<Certificate>>({});
  const [isEditingCertificate, setIsEditingCertificate] = useState(false);
  const [isSavingCertificate, setIsSavingCertificate] = useState(false);

  // Form state for new certificate
  const [newCertificate, setNewCertificate] = useState({
  date_of_calibration: format(new Date(), 'yyyy-MM-dd'),
  certificate_number: '',
  customer_name: selectedJob?.customer_name || '',
  equipment_details: '',
  calibration_due_date: format(addYears(new Date(), 1), 'yyyy-MM-dd'),
  location: '',
  make: '',
  model: '',
  capacity: '',
  serial_no: '',
  asset_no: '',
  notification_sent: false
});

  // Fetch job history
  const { data: jobHistory = [], refetch: refetchJobHistory } = useQuery<Job[]>({
    queryKey: ['jobHistory'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/job-requests', {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 10, sort: 'date:desc' }
      });
      return response.data?.data?.map((job: any) => ({
        ...job,
        notifications_enabled: job.notifications_enabled ?? true
      })) || [];
    },
    enabled: !!user,
  });

  // Fetch certificates for selected job
  const { data: certificates = [], refetch: refetchCertificates } = useQuery<Certificate[]>({
    queryKey: ['certificates', selectedJobId],
    queryFn: async () => {
      if (!selectedJobId) return [];
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/certificates`, {
        params: { job_request_id: selectedJobId },
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data?.data || [];
    },
    enabled: !!selectedJobId && !!user,
  });

  // Fetch customers
  const { data: customers = [], refetch: refetchCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/customers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data || [];
    },
    enabled: !!user,
  });

  // Filter customers based on search term
  const filteredCustomers = customers.filter((customer: any) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /// Handle job selection
const handleJobSelect = (job: Job) => {
  setSelectedJobId(job.id);
  setSelectedJob(job);
  setActiveTab('certificates');
  setNewCertificate({
    date_of_calibration: format(new Date(), 'yyyy-MM-dd'),
    certificate_number: '',
    customer_name: job.customer_name,
    equipment_details: '',
    calibration_due_date: format(addYears(new Date(job.date), 1), 'yyyy-MM-dd'),
    location: '',
    make: '',
    model: '',
    capacity: '',
    serial_no: '',
    asset_no: '',
    notification_sent: false
  });
};

  // Handle edit certificate
  const handleEditClick = (certificate: Certificate) => {
  setEditingId(certificate.id);
  setEditingCertificate({
    equipment_details: certificate.equipment_details,
    location: certificate.location,
    date_of_calibration: certificate.date_of_calibration,
    calibration_due_date: certificate.calibration_due_date,
    make: certificate.make || '',
    model: certificate.model || '',
    capacity: certificate.capacity || '',
    serial_no: certificate.serial_no || '',
    asset_no: certificate.asset_no || ''
  });
};

const handleSaveCertificate = async () => {
  if (!selectedJobId) return;

  setIsSavingCertificate(true);
  try {
    const token = localStorage.getItem('token');
    const method = isEditingCertificate && newCertificate.id ? 'put' : 'post';
    const url = isEditingCertificate && newCertificate.id 
      ? `/api/certificates/${newCertificate.id}`
      : '/api/certificates';

    // Ensure dates are in YYYY-MM-DD format
    const payload = {
      job_request_id: selectedJobId,
      date_of_calibration: newCertificate.date_of_calibration.split('T')[0],
      calibration_due_date: newCertificate.calibration_due_date.split('T')[0],
      customer_name: newCertificate.customer_name,
      equipment_details: newCertificate.equipment_details,
      location: newCertificate.location,
      make: newCertificate.make,
      model: newCertificate.model,
      capacity: newCertificate.capacity,
      serial_no: newCertificate.serial_no,
      asset_no: newCertificate.asset_no
    };

    await axios[method](url, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    await refetchCertificates();
    toast.success(`Certificate ${isEditingCertificate ? 'updated' : 'created'} successfully`);
    
    // Reset form
    if (selectedJob) {
      setNewCertificate({
        date_of_calibration: format(new Date(), 'yyyy-MM-dd'),
        certificate_number: '',
        customer_name: selectedJob.customer_name,
        equipment_details: '',
        calibration_due_date: format(addYears(new Date(selectedJob.date), 1), 'yyyy-MM-dd'),
        location: '',
        make: '',
        model: '',
        capacity: '',
        serial_no: '',
        asset_no: '',
        notification_sent: false
      });
    }
    setIsEditingCertificate(false);
  } catch (err) {
    console.error('Error saving certificate', err);
    toast.error(`Failed to ${isEditingCertificate ? 'update' : 'create'} certificate`);
  } finally {
    setIsSavingCertificate(false);
  }
};

  // Toggle notifications for a job
  const toggleNotifications = async (jobId: number) => {
    try {
      const token = localStorage.getItem('token');
      const job = jobHistory.find(j => j.id === jobId);
      if (!job) {
        toast.error('Job not found');
        return;
      }
      
      const newStatus = !job.notifications_enabled;
      await axios.patch(`/api/job-requests/${jobId}`, {
        notifications_enabled: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await refetchJobHistory();
      toast.success(`Notifications ${newStatus ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update notification settings');
      console.error(error);
    }
  };

  // Handle customer selection
  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer);
    setCustomerId(customer.id);
    setSearchTerm(customer.name);
    setShowCustomerDropdown(false);
  };

  const clearCustomerSelection = () => {
    setSelectedCustomer(null);
    setSearchTerm("");
    setCustomerId("");
    setShowCustomerDropdown(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowCustomerDropdown(value.length > 0);
  };

  // Close dropdown when clicking outside
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

  // Form handling for customer
  const {
    register: registerCustomer,
    handleSubmit: handleSubmitCustomer,
    formState: { errors: customerErrors },
    reset: resetCustomerForm
  } = useForm<CustomerFormData>();

  // Add customer mutation
  const addCustomerMutation = useMutation({
    mutationFn: async (newCustomer: CustomerFormData) => {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/customers', newCustomer, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Customer added successfully');
      refetchCustomers();
      resetCustomerForm();
      setShowCustomerModal(false);
    },
    onError: (error) => {
      toast.error('Failed to add customer');
      console.error('Error adding customer:', error);
    }
  });

  // Generate job number mutation
  const generateJobMutation = useMutation({
    mutationFn: async (jobData: {
      jobType: string;
      date: string;
      customerId: number;
    }) => {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/job-requests/generate', jobData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      setJobNumber(data.jobNumber);
      toast.success('Job number generated successfully');
      refetchJobHistory();
    },
    onError: (error) => {
      toast.error('Failed to generate job number');
      console.error('Error generating job number:', error);
    },
    onSettled: () => {
      setIsGenerating(false);
    }
  });

  // Generate job number
  const generateJobNumber = () => {
    if (!date || !customerId) {
      toast.error('Please select a date and customer');
      return;
    }

    setIsGenerating(true);
    generateJobMutation.mutate({
      jobType,
      date,
      customerId: Number(customerId)
    });
  };

  // Handle customer form submission
  const onCustomerSubmit = (data: CustomerFormData) => {
    addCustomerMutation.mutate(data);
  };

  // Effect to check authentication
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`py-2 px-4 font-medium text-sm ${activeTab === 'jobRequest' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('jobRequest')}
        >
          Job Requests
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm ${activeTab === 'certificates' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('certificates')}
          disabled={!selectedJobId}
        >
          Certificates
        </button>
      </div>

      {activeTab === 'jobRequest' ? (
        <>
          {/* Job Request Generator Card */}
          <Card className="border border-gray-100 shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-xl sm:text-2xl font-bold text-white">Job Request Generator</CardTitle>
                  <CardDescription className="text-blue-100 text-sm sm:text-base">
                    Create a new job request with an automatically generated number
                  </CardDescription>
                </div>
                <div className="bg-white/10 p-2 rounded-lg self-start sm:self-auto">
                  <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Job Type Selection */}
              <div className="space-y-2">
                <Label className="block text-sm font-medium text-gray-700">Job Type</Label>
                <RadioGroup
                  value={jobType}
                  onValueChange={setJobType}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
                >
                  <div>
                    <RadioGroupItem value="accredited" id="accredited" className="peer hidden" />
                    <Label
                      htmlFor="accredited"
                      className="flex flex-col p-3 sm:p-4 rounded-md border-2 border-gray-200 bg-white hover:bg-gray-50 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50 cursor-pointer transition-all"
                    >
                      <span className="font-medium text-gray-900">Accredited</span>
                      <span className="text-xs sm:text-sm text-gray-500 mt-1">Standard job type</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="non-accredited" id="non-accredited" className="peer hidden" />
                    <Label
                      htmlFor="non-accredited"
                      className="flex flex-col p-3 sm:p-4 rounded-md border-2 border-gray-200 bg-white hover:bg-gray-50 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50 cursor-pointer transition-all"
                    >
                      <span className="font-medium text-gray-900">Non-Accredited</span>
                      <span className="text-xs sm:text-sm text-gray-500 mt-1">Special job type</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Date Selection */}
              <div className="space-y-2">
                <Label htmlFor="job-date" className="block text-sm font-medium text-gray-700">
                  Job Date
                </Label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  </div>
                  <Input
                    id="job-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="block w-full rounded-md border-gray-300 pl-10 sm:pl-10 text-sm sm:text-base h-10 sm:h-11"
                  />
                </div>
              </div>

              {/* Customer Selection */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <Label className="block text-sm font-medium text-gray-700">Customer</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCustomerModal(true)}
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 w-full sm:w-auto justify-start sm:justify-center"
                  >
                    <Plus className="mr-1 h-4 w-4" /> Add New
                  </Button>
                </div>

                <div className="relative customer-search-container">
                  <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <Input
                      type="text"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      onFocus={() => setShowCustomerDropdown(searchTerm.length > 0)}
                      placeholder="Search customers..."
                      className="block w-full rounded-md border-gray-300 pl-10 sm:pl-10 text-sm sm:text-base h-10 sm:h-11"
                    />
                    {selectedCustomer && (
                      <button
                        type="button"
                        onClick={clearCustomerSelection}
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                      >
                        <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" />
                      </button>
                    )}
                  </div>

                  {/* Customer Dropdown */}
                  {showCustomerDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer) => (
                          <div
                            key={customer.id}
                            className="px-3 py-2 sm:px-4 sm:py-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                            onClick={() => handleCustomerSelect(customer)}
                          >
                            <div className="font-medium text-sm sm:text-base text-gray-900">{customer.name}</div>
                            {customer.contactPerson && (
                              <div className="text-xs sm:text-sm text-gray-500">{customer.contactPerson}</div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-xs sm:text-sm text-gray-500">No customers found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Generate Button */}
              <div className="pt-3 sm:pt-4">
                <Button
                  onClick={generateJobNumber}
                  disabled={isGenerating || generateJobMutation.isPending}
                  className="w-full py-2 sm:py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm sm:text-base"
                >
                  {isGenerating || generateJobMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Job Number'
                  )}
                </Button>
              </div>

              {/* Generated Job Number */}
              {jobNumber && (
                <div className="mt-4 sm:mt-6 p-4 sm:p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                  <div className="text-xs sm:text-sm font-medium text-blue-600">Generated Job Number</div>
                  <div className="text-2xl sm:text-3xl font-bold text-blue-800 mt-1">{jobNumber}</div>
                  <div className="mt-2 sm:mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(jobNumber);
                        toast.success('Copied to clipboard');
                      }}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50 text-xs sm:text-sm"
                    >
                      Copy to Clipboard
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Job Numbers */}
          <Card className="border border-gray-100 shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gray-50 p-4 sm:p-6 border-b border-gray-200">
              <CardTitle className="text-lg sm:text-xl font-semibold text-gray-800">Recent Job Requests</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-gray-500">
                Last 10 generated job requests
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                {jobHistory.map((job: Job) => (
                  <div
                    key={job.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow gap-2 sm:gap-4"
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="bg-blue-100 p-2 sm:p-3 rounded-lg">
                        <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm sm:text-base text-gray-900">{job.job_number}</div>
                        <div className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                          {format(new Date(job.date), 'PPP')} • {job.customer_name}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        onClick={() => handleJobSelect(job)}
                      >
                        View Certificates
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleNotifications(job.id)}
                        className={job.notifications_enabled ? 'text-green-600 hover:bg-green-50' : 'text-gray-500 hover:bg-gray-50'}
                      >
                        {job.notifications_enabled ? (
                          <Bell className="h-4 w-4" />
                        ) : (
                          <BellOff className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
   <Card className="border border-gray-100 shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-xl sm:text-2xl font-bold text-white">Certificate Management</CardTitle>
                  <CardDescription className="text-blue-100 text-sm sm:text-base">
                    Manage certificates for {selectedJob?.job_number}
                  </CardDescription>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveTab('jobRequest')}
                >
                  Back to Jobs
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-6">
              {/* Certificate Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Left Column */}
  <div className="space-y-4">
    <div>
      <Label htmlFor="certificateNumber">Certificate Number</Label>
      <Input
        id="certificateNumber"
        value={newCertificate.certificate_number || 'Will be generated automatically'}
        disabled
        className="text-gray-500 italic"
      />
    </div>

    <div>
      <Label htmlFor="make">Make</Label>
      <Input
        id="make"
        value={newCertificate.make || ''}
        onChange={(e) => setNewCertificate({...newCertificate, make: e.target.value})}
      />
    </div>

    <div>
      <Label htmlFor="model">Model</Label>
      <Input
        id="model"
        value={newCertificate.model || ''}
        onChange={(e) => setNewCertificate({...newCertificate, model: e.target.value})}
      />
    </div>

    <div>
      <Label htmlFor="equipmentDetails">Equipment Details</Label>
      <Input
        id="equipmentDetails"
        value={newCertificate.equipment_details}
        onChange={(e) => setNewCertificate({...newCertificate, equipment_details: e.target.value})}
      />
    </div>

    <div>
      <Label htmlFor="location">Location</Label>
      <Input
        id="location"
        value={newCertificate.location}
        onChange={(e) => setNewCertificate({...newCertificate, location: e.target.value})}
      />
    </div>
  </div>

  {/* Right Column */}
  <div className="space-y-4">
    <div>
      <Label htmlFor="capacity">Capacity</Label>
      <Input
        id="capacity"
        value={newCertificate.capacity || ''}
        onChange={(e) => setNewCertificate({...newCertificate, capacity: e.target.value})}
      />
    </div>

    <div>
      <Label htmlFor="serialNo">Serial Number</Label>
      <Input
        id="serialNo"
        value={newCertificate.serial_no || ''}
        onChange={(e) => setNewCertificate({...newCertificate, serial_no: e.target.value})}
      />
    </div>

    <div>
      <Label htmlFor="assetNo">Asset Number</Label>
      <Input
        id="assetNo"
        value={newCertificate.asset_no || ''}
        onChange={(e) => setNewCertificate({...newCertificate, asset_no: e.target.value})}
      />
    </div>

    <div>
      <Label htmlFor="dateOfCalibration">Date of Calibration</Label>
      <Input
        id="dateOfCalibration"
        type="date"
        value={newCertificate.date_of_calibration}
        onChange={(e) => setNewCertificate({...newCertificate, date_of_calibration: e.target.value})}
      />
    </div>

    <div>
      <Label htmlFor="calibrationDueDate">Calibration Due Date</Label>
      <Input
        id="calibrationDueDate"
        type="date"
        value={newCertificate.calibration_due_date}
        onChange={(e) => setNewCertificate({...newCertificate, calibration_due_date: e.target.value})}
      />
    </div>
                  <Button 
                    onClick={handleSaveCertificate} 
                    className="w-full"
                    disabled={isSavingCertificate}
                  >
                    {isSavingCertificate ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      isEditingCertificate ? 'Update Certificate' : 'Save Certificate'
                    )}
                  </Button>
                </div>
                </div>
            
   {/* Certificates List */}
             <div className="mt-6">
  <h3 className="text-lg font-semibold mb-4">Existing Certificates</h3>
  <div className="overflow-x-auto border rounded-lg">
    {/* Desktop/Tablet View */}
    <table className="hidden md:table min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cert No.</th>
          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Equipment</th>
          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Make</th>
          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Serial No.</th>
          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cal Date</th>
          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {certificates.length > 0 ? (
          certificates.map((certificate) => (
            <tr key={certificate.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 text-sm font-medium text-gray-900">{certificate.certificate_number}</td>
              <td className="px-3 py-2 text-sm text-gray-700">
                {editingId === certificate.id ? (
                  <Input
                    value={editingCertificate.equipment_details || ''}
                    onChange={(e) => setEditingCertificate({ ...editingCertificate, equipment_details: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded p-1 h-8"
                  />
                ) : (
                  <span>{certificate.equipment_details}</span>
                )}
              </td>
              <td className="px-3 py-2 text-sm text-gray-700">
                {editingId === certificate.id ? (
                  <Input
                    value={editingCertificate.make || ''}
                    onChange={(e) => setEditingCertificate({ ...editingCertificate, make: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded p-1 h-8"
                  />
                ) : (
                  certificate.make || '-'
                )}
              </td>
              <td className="px-3 py-2 text-sm text-gray-700">
                {editingId === certificate.id ? (
                  <Input
                    value={editingCertificate.model || ''}
                    onChange={(e) => setEditingCertificate({ ...editingCertificate, model: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded p-1 h-8"
                  />
                ) : (
                  certificate.model || '-'
                )}
              </td>
              <td className="px-3 py-2 text-sm text-gray-700">
                {editingId === certificate.id ? (
                  <Input
                    value={editingCertificate.serial_no || ''}
                    onChange={(e) => setEditingCertificate({ ...editingCertificate, serial_no: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded p-1 h-8"
                  />
                ) : (
                  certificate.serial_no || '-'
                )}
              </td>
              <td className="px-3 py-2 text-sm text-gray-700">
                {editingId === certificate.id ? (
                  <Input
                    value={editingCertificate.location || ''}
                    onChange={(e) => setEditingCertificate({ ...editingCertificate, location: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded p-1 h-8"
                  />
                ) : (
                  certificate.location || '-'
                )}
              </td>
              <td className="px-3 py-2 text-sm text-gray-700">
                {editingId === certificate.id ? (
                  <Input
                    type="date"
                    value={editingCertificate.date_of_calibration?.toString().split('T')[0] || ''}
                    onChange={(e) => setEditingCertificate({ ...editingCertificate, date_of_calibration: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded p-1 h-8"
                  />
                ) : (
                  format(new Date(certificate.date_of_calibration), 'dd/MM/yy')
                )}
              </td>
              <td className="px-3 py-2 text-sm text-gray-700">
                {editingId === certificate.id ? (
                  <Input
                    type="date"
                    value={editingCertificate.calibration_due_date?.toString().split('T')[0] || ''}
                    onChange={(e) => setEditingCertificate({ ...editingCertificate, calibration_due_date: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded p-1 h-8"
                  />
                ) : (
                  format(new Date(certificate.calibration_due_date), 'dd/MM/yy')
                )}
              </td>
              <td className="px-3 py-2 text-sm text-gray-700">
                {editingId === certificate.id ? (
                  <div className="flex space-x-1">
                    <Button variant="outline" size="sm" onClick={handleCancelEdit} className="h-8 px-2">
                      Cancel
                    </Button>
                    <Button variant="default" size="sm" onClick={() => handleSaveEdit(certificate.id)} className="h-8 px-2">
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditClick(certificate)}
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={9} className="text-center py-4 text-gray-500">
              No certificates found for this job.
            </td>
          </tr>
        )}
      </tbody>
    </table>

    {/* Mobile View */}
    <div className="md:hidden space-y-3 p-3">
      {certificates.length > 0 ? (
        certificates.map((certificate) => (
          <div key={certificate.id} className="border border-gray-300 rounded-xl p-4 shadow-sm">
            <div className="space-y-2 text-sm text-gray-700">
              <div>
                <span className="font-semibold text-gray-800">Cert No:</span> {certificate.certificate_number}
              </div>

              <div className="flex justify-between">
                <span>Equipment:</span>
                {editingId === certificate.id ? (
                  <Input
                    value={editingCertificate.equipment_details || ''}
                    onChange={(e) => setEditingCertificate({ ...editingCertificate, equipment_details: e.target.value })}
                    className="text-sm border border-gray-300 rounded px-2 h-8 w-1/2"
                  />
                ) : (
                  <span>{certificate.equipment_details}</span>
                )}
              </div>

              <div className="flex justify-between">
                <span>Make/Model:</span>
                {editingId === certificate.id ? (
                  <div className="flex gap-2 w-1/2">
                    <Input
                      value={editingCertificate.make || ''}
                      onChange={(e) => setEditingCertificate({ ...editingCertificate, make: e.target.value })}
                      className="text-sm border border-gray-300 rounded px-2 h-8 w-1/2"
                    />
                    <Input
                      value={editingCertificate.model || ''}
                      onChange={(e) => setEditingCertificate({ ...editingCertificate, model: e.target.value })}
                      className="text-sm border border-gray-300 rounded px-2 h-8 w-1/2"
                    />
                  </div>
                ) : (
                  <span>{certificate.make || '-'}/{certificate.model || '-'}</span>
                )}
              </div>

              <div className="flex justify-between">
                <span>Serial No:</span>
                {editingId === certificate.id ? (
                  <Input
                    value={editingCertificate.serial_no || ''}
                    onChange={(e) => setEditingCertificate({ ...editingCertificate, serial_no: e.target.value })}
                    className="text-sm border border-gray-300 rounded px-2 h-8 w-1/2"
                  />
                ) : (
                  <span>{certificate.serial_no || '-'}</span>
                )}
              </div>

              <div className="flex justify-between">
                <span>Dates:</span>
                {editingId === certificate.id ? (
                  <div className="flex gap-2 w-1/2">
                    <Input
                      type="date"
                      value={editingCertificate.date_of_calibration?.toString().split('T')[0] || ''}
                      onChange={(e) => setEditingCertificate({ ...editingCertificate, date_of_calibration: e.target.value })}
                      className="text-sm border border-gray-300 rounded px-2 h-8 w-1/2"
                    />
                    <Input
                      type="date"
                      value={editingCertificate.calibration_due_date?.toString().split('T')[0] || ''}
                      onChange={(e) => setEditingCertificate({ ...editingCertificate, calibration_due_date: e.target.value })}
                      className="text-sm border border-gray-300 rounded px-2 h-8 w-1/2"
                    />
                  </div>
                ) : (
                  <span>
                    {format(new Date(certificate.date_of_calibration), 'dd/MM/yy')} →
                    {format(new Date(certificate.calibration_due_date), 'dd/MM/yy')}
                  </span>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                {editingId === certificate.id ? (
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={handleCancelEdit}>Cancel</Button>
                    <Button variant="default" size="sm" onClick={() => handleSaveEdit(certificate.id)}>Save</Button>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => handleEditClick(certificate)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-4 text-gray-500">No certificates found for this job.</div>
      )}
    </div>
  </div>
</div>


            </CardContent>
          </Card>
        </>
      )}

      {/* Add Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Add New Customer</h2>
              <button
                onClick={() => {
                  resetCustomerForm();
                  setShowCustomerModal(false);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
    
            <div className="px-4 py-3 sm:px-6 sm:py-5 overflow-y-auto flex-1">
              <form id="customer-form" onSubmit={handleSubmitCustomer(onCustomerSubmit)} className="space-y-4 sm:space-y-5">
                {[
                  { name: 'name', label: 'Customer Name', required: true },
                  { name: 'address', label: 'Address', required: true, textarea: true },
                  { name: 'contactPerson', label: 'Contact Person', required: true },
                  { name: 'phone', label: 'Phone', required: true },
                  { name: 'email', label: 'Email', required: false }
                ].map((field) => (
                  <div key={field.name} className="space-y-1.5">
                    <Label htmlFor={field.name} className="text-xs sm:text-sm font-medium text-gray-700">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    {field.textarea ? (
                      <Textarea
                        id={field.name}
                        {...registerCustomer(field.name as keyof CustomerFormData, { required: field.required })}
                        className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs sm:text-sm ${
                          customerErrors[field.name as keyof CustomerFormData] ? 'border-red-500' : ''
                        }`}
                      />
                    ) : (
                      <Input
                        id={field.name}
                        type={field.name === 'email' ? 'email' : 'text'}
                        {...registerCustomer(field.name as keyof CustomerFormData, { required: field.required })}
                        className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs sm:text-sm ${
                          customerErrors[field.name as keyof CustomerFormData] ? 'border-red-500' : ''
                        }`}
                      />
                    )}
                    {customerErrors[field.name as keyof CustomerFormData] && (
                      <p className="text-xs sm:text-sm text-red-500">This field is required</p>
                    )}
                  </div>
                ))}
              </form>
            </div>
    
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <Button
                type="button"
                onClick={() => {
                  resetCustomerForm();
                  setShowCustomerModal(false);
                }}
                disabled={addCustomerMutation.isPending}
                className="bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 w-full sm:w-auto text-xs sm:text-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="customer-form"
                disabled={addCustomerMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm w-full sm:w-auto text-xs sm:text-sm"
              >
                {addCustomerMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Customer'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}