import { useState, useEffect } from 'react'
import { Clock, Search, Filter, Calendar, FileText, User, Loader2, X, Printer, Edit, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select"
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

type JobStatus = 'pending_inspection' | 'pending_quotation' | 'pending_approval' | 'approved' | 'ready_for_delivery' | 'completed'

interface SparePart {
  id: number
  part_name: string
  quantity: number
  unit_price: number
}

interface Inspection {
  id: number
  job_id: number
  problems_found: string | null
  inspected_by: string
  inspection_date: string
  total_cost: number
  notes: string | null
  spare_parts: SparePart[]
  findings?: string
  technician_id?: number
  technician_name?: string
}

interface Approval {
  id: number
  job_id: number
  prepared_by: number // user ID
  prepared_by_name: string // display name
  approval_date: string
  notes?: string
  lpo_number?: string
}

interface Quotation {
  id: number
  job_id: number
  quotation_number: string
  amount: number
  status: string
  created_at: string
  quotation_date: string
  description?: string
  remarks?: string
  lpo_document?: string
}

interface Job {
  id: number
  job_number: string
  customer_id: number
  customer_name: string
  customer_phone?: string
  customer_email?: string
  taken_by: string
  status: JobStatus
  scale_make?: string
  scale_model?: string
  scale_serial?: string
  created_at: string
  updated_at: string
  remark?: string
  lpo_number?: string
  quotation_number?: string
  quotation_amount?: number
  approved_by?: string
  approval_date?: string
  invoice_number?: string
  invoice_amount?: number
  invoice_date?: string
  delivered_by?: string
  delivery_date?: string
}

const statusLabels: Record<JobStatus, string> = {
  pending_inspection: 'Pending Inspection',
  pending_quotation: 'Pending Quotation',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  ready_for_delivery: 'Ready for Delivery',
  completed: 'Completed'
}

const user = JSON.parse(localStorage.getItem('user') || '{}'); // or from auth context
const currentUserId = user.id;
const currentUsername = user.name;


const statusColors: Record<JobStatus, string> = {
  pending_inspection: 'bg-yellow-100 text-yellow-800',
  pending_quotation: 'bg-blue-100 text-blue-800',
  pending_approval: 'bg-purple-100 text-purple-800',
  approved: 'bg-green-100 text-green-800',
  ready_for_delivery: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-gray-100 text-gray-800'
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED'
  }).format(amount)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

interface JobDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  job: Job | null
  inspection: Inspection | null
  quotation: Quotation | null
  approval: Approval | null
  isLoading: boolean
  onUpdate: () => void
}

interface EditJobFormProps {
  job: Job
  onSave: (updatedJob: Partial<Job>) => void
  onCancel: () => void
}

interface EditQuotationFormProps {
  quotation: Quotation
  onSave: (updatedQuotation: Partial<Quotation>) => void
  onCancel: () => void
}

interface EditApprovalFormProps {
  approval: Approval
  onSave: (updatedApproval: Partial<Approval>) => void
  onCancel: () => void
}

interface EditInspectionFormProps {
  inspection: Inspection
  onSave: (updatedInspection: Partial<Inspection>) => void
  onCancel: () => void
}

interface EditDeliveryFormProps {
  job: Job
  onSave: (updatedJob: Partial<Job>) => void
  onCancel: () => void
}

const EditJobForm: React.FC<EditJobFormProps> = ({ job, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Job>>({
    scale_make: job.scale_make,
    scale_model: job.scale_model,
    scale_serial: job.scale_serial,
    remark: job.remark,
    lpo_number: job.lpo_number
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <h3 className="font-semibold text-lg mb-4">Edit Job Details</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scale Make</label>
            <Input
              name="scale_make"
              value={formData.scale_make || ''}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scale Model</label>
            <Input
              name="scale_model"
              value={formData.scale_model || ''}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
            <Input
              name="scale_serial"
              value={formData.scale_serial || ''}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">LPO Number</label>
            <Input
              name="lpo_number"
              value={formData.lpo_number || ''}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <Textarea
              name="remark"
              value={formData.remark || ''}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              rows={1}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}

const EditQuotationForm: React.FC<EditQuotationFormProps> = ({ quotation, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Quotation>>({
    quotation_number: quotation.quotation_number,
    amount: quotation.amount,
    quotation_date : quotation.quotation_date,
    description: quotation.description,
    remarks: quotation.remarks
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0
    setFormData(prev => ({ ...prev, amount: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <h3 className="font-semibold text-lg mb-4">Edit Quotation Details</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quotation Number</label>
            <Input
              name="quotation_number"
              value={formData.quotation_number || ''}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (AED)</label>
            <Input
              type="number"
              name="amount"
              value={formData.amount || 0}
              onChange={handleAmountChange}
              className="w-full border rounded px-3 py-2"
            />
            </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <Input
              type="date"
              name="quotation_date"
              value={formData.quotation_date ? formData.quotation_date.substring(0, 10) : ''}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}

const EditApprovalForm: React.FC<EditApprovalFormProps> = ({ approval, onSave, onCancel }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [formData, setFormData] = useState<Partial<Approval>>({
  prepared_by: user?.id, // if user is logged in
  prepared_by_name: user?.name,
  lpo_number: approval.lpo_number,
  notes: approval.notes
});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
};

  const handleSubmit = () => {
    onSave(formData); // this should include prepared_by
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <h3 className="font-semibold text-lg mb-4">Edit Approval Details</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prepared By (User ID)</label>
      <Input
        name="prepared_by"
        value={formData.prepared_by || ''}
        onChange={handleChange}
        className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">LPO Number</label>
            <Input
              name="lpo_number"
              value={formData.lpo_number || ''}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <Textarea
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              rows={1}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}

const EditInspectionForm: React.FC<EditInspectionFormProps> = ({ inspection, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Inspection>>({
    problems_found: inspection.problems_found || '',
    findings: inspection.findings || '',
    notes: inspection.notes || '',
    technician_name: inspection.technician_name || ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <h3 className="font-semibold text-lg mb-4">Edit Inspection Details</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Technician</label>
            <Input
              name="technician_name"
              value={formData.technician_name || ''}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Problems Found</label>
            <Textarea
              name="problems_found"
              value={formData.problems_found || ''}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              rows={1}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Findings</label>
            <Textarea
              name="findings"
              value={formData.findings || ''}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              rows={1}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <Textarea
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              rows={3}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}

const EditDeliveryForm: React.FC<EditDeliveryFormProps> = ({ job, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Job>>({
    invoice_number: job.invoice_number,
    invoice_amount: job.invoice_amount,
    delivered_by: job.delivered_by
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0
    setFormData(prev => ({ ...prev, invoice_amount: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <h3 className="font-semibold text-lg mb-4">Edit Delivery Details</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
            <Input
              name="invoice_number"
              value={formData.invoice_number || ''}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Amount (AED)</label>
            <Input
              type="number"
              name="invoice_amount"
              value={formData.invoice_amount || 0}
              onChange={handleAmountChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivered By</label>
            <Input
              name="delivered_by"
              value={formData.delivered_by || ''}
              className="w-full border rounded px-3 py-2"
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}

const JobDetailsModal: React.FC<JobDetailsModalProps> = ({
  isOpen,
  onClose,
  job,
  inspection,
  quotation,
  approval,
  isLoading,
  onUpdate
}) => {
  // Initialize all state hooks at the top level
  const [editMode, setEditMode] = useState<'job' | 'quotation' | 'approval' | 'inspection' | 'delivery' | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    job: true,
    quotation: true,
    approval: true,
    inspection: true,
    delivery: true
  })

  // Form states - initialize them with empty/default values
  const [jobForm, setJobForm] = useState<Partial<Job>>({})
  const [inspectionForm, setInspectionForm] = useState<Partial<Inspection>>({})
  const [quotationForm, setQuotationForm] = useState<Partial<Quotation>>({})
  const [approvalForm, setApprovalForm] = useState<Partial<Approval>>({})

  // Update form states when props change
  useEffect(() => {
    if (job) {
      setJobForm({
        ...job,
        remark: job.remark || '',
        lpo_number: job.lpo_number || '',
        scale_make: job.scale_make || '',
        scale_model: job.scale_model || '',
        scale_serial: job.scale_serial || '',
        customer_phone: job.customer_phone || '',
        customer_email: job.customer_email || ''
      })
    }

    if (inspection) {
      setInspectionForm({
        ...inspection,
        problems_found: inspection.problems_found || '',
        notes: inspection.notes || '',
        findings: inspection.findings || ''
      })
    }

    if (quotation) {
      setQuotationForm({
        ...quotation,
        description: quotation.description || '',
        remarks: quotation.remarks || ''
      })
    }

    if (approval) {
      setApprovalForm({
        ...approval,
        notes: approval.notes || '',
        lpo_number: approval.lpo_number || ''
      })
    }
  }, [job, inspection, quotation, approval])

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleSaveJob = async (updatedJob: Partial<Job>) => {
    try {
      setIsSaving(true)
      const response = await fetch(`/api/jobs/${job?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedJob)
      })

      if (!response.ok) {
        throw new Error('Failed to update job')
      }

      toast.success('Job updated successfully')
      setEditMode(null)
      onUpdate()
    } catch (error) {
      console.error('Error updating job:', error)
      toast.error('Failed to update job')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveQuotation = async (updatedQuotation: Partial<Quotation>) => {
  if (!quotation) return;
  
  try {
    setIsSaving(true);
    const response = await fetch(`/api/quotations/${quotation.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(updatedQuotation)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update quotation');
    }

    const data = await response.json();
    toast.success('Quotation updated successfully');
    setEditMode(null);
    onUpdate();
    return data;
  } catch (error) {
    console.error('Error updating quotation:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to update quotation');
    throw error;
  } finally {
    setIsSaving(false);
  }
};

  const handleSaveApproval = async (updatedApproval: Partial<Approval>) => {
    if (!approval) return
    
    try {
      setIsSaving(true)
      const response = await fetch(`/api/approvals/${approval.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedApproval)
      })

      if (!response.ok) {
        throw new Error('Failed to update approval')
      }

      toast.success('Approval updated successfully')
      setEditMode(null)
      onUpdate()
    } catch (error) {
      console.error('Error updating approval:', error)
      toast.error('Failed to update approval')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveInspection = async (updatedInspection: Partial<Inspection>) => {
    if (!inspection) return
    
    try {
      setIsSaving(true)
      const response = await fetch(`/api/jobs/inspections/${inspection.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedInspection)
      })

      if (!response.ok) {
        throw new Error('Failed to update inspection')
      }

      toast.success('Inspection updated successfully')
      setEditMode(null)
      onUpdate()
    } catch (error) {
      console.error('Error updating inspection:', error)
      toast.error('Failed to update inspection')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveDelivery = async (updatedJob: Partial<Job>) => {
    try {
      setIsSaving(true)
      const response = await fetch(`/api/jobs/${job?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedJob)
      })

      if (!response.ok) {
        throw new Error('Failed to update delivery details')
      }

      toast.success('Delivery details updated successfully')
      setEditMode(null)
      onUpdate()
    } catch (error) {
      console.error('Error updating delivery details:', error)
      toast.error('Failed to update delivery details')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen || !job) return null


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold">Job Details - {job.job_number}</h2>
          <button
  onClick={() => {
    setEditMode(null);
    onClose();
  }}
  className="relative inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-150 ease-in-out"
  aria-label="Close"
  title="Close"
>
  <X className="h-5 w-5" />
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
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-lg">Job Details</h3>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleSection('job')}
                  >
                    {expandedSections.job ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditMode('job')}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {editMode === 'job' ? (
                <EditJobForm
                  job={job}
                  onSave={handleSaveJob}
                  onCancel={() => setEditMode(null)}
                />
              ) : expandedSections.job && (
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
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-medium">
                      <span className={`px-2 py-1 rounded-full text-xs ${statusColors[job.status]}`}>
                        {statusLabels[job.status]}
                      </span>
                    </p>
                  </div>
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
              )}
            </div>

            {/* Quotation Section */}
            {quotation && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-lg">Quotation Details</h3>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSection('quotation')}
                    >
                      {expandedSections.quotation ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditMode('quotation')}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {editMode === 'quotation' ? (
                  <EditQuotationForm
                    quotation={quotation}
                    onSave={handleSaveQuotation}
                    onCancel={() => setEditMode(null)}
                  />
                ) : expandedSections.quotation && (
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
                )}
              </div>
            )}

            {/* Approval Section */}
            {approval && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-lg">Approval Details</h3>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSection('approval')}
                    >
                      {expandedSections.approval ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditMode('approval')}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {editMode === 'approval' ? (
                  <EditApprovalForm
                    approval={approval}
                    onSave={handleSaveApproval}
                    onCancel={() => setEditMode(null)}
                  />
                ) : expandedSections.approval && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Prepared By</p>
                      <p className="font-medium">{approval.prepared_by_name}</p>
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
                )}
              </div>
            )}

            {/* Inspection Section */}
            {inspection && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-lg">Inspection Details</h3>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSection('inspection')}
                    >
                      {expandedSections.inspection ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditMode('inspection')}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {editMode === 'inspection' ? (
                  <EditInspectionForm
                    inspection={inspection}
                    onSave={handleSaveInspection}
                    onCancel={() => setEditMode(null)}
                  />
                ) : expandedSections.inspection && (
                  <>
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
                  </>
                )}
              </div>
            )}

            {/* Spare Parts Section */}
            {inspection?.spare_parts && inspection.spare_parts.length > 0 && expandedSections.inspection && editMode !== 'inspection' && (
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
                          {formatCurrency(
                            inspection.spare_parts.reduce(
                              (sum, part) => sum + (part.quantity * part.unit_price),
                              0
                            )
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Delivery Section (if completed) */}
            {job.status === 'completed' && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-lg">Delivery Details</h3>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSection('delivery')}
                    >
                      {expandedSections.delivery ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditMode('delivery')}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {editMode === 'delivery' ? (
                  <EditDeliveryForm
                    job={job}
                    onSave={handleSaveDelivery}
                    onCancel={() => setEditMode(null)}
                  />
                ) : expandedSections.delivery && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {job.invoice_number && (
                      <div>
                        <p className="text-sm text-gray-600">Invoice Number</p>
                        <p className="font-medium">{job.invoice_number}</p>
                      </div>
                    )}
                    {job.invoice_date && (
                      <div>
                        <p className="text-sm text-gray-600">Invoice Date</p>
                        <p className="font-medium">{formatDate(job.invoice_date)}</p>
                      </div>
                    )}
                    {job.invoice_amount && (
                      <div>
                        <p className="text-sm text-gray-600">Invoice Amount</p>
                        <p className="font-medium">{formatCurrency(job.invoice_amount)}</p>
                      </div>
                    )}
                    {job.delivered_by && (
                      <div>
                        <p className="text-sm text-gray-600">Delivered By</p>
                        <p className="font-medium">{job.delivered_by}</p>
                      </div>
                    )}
                    {job.delivery_date && (
                      <div>
                        <p className="text-sm text-gray-600">Delivery Date</p>
                        <p className="font-medium">{formatDate(job.delivery_date)}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function JobHistory() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all')
  
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null)
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isFetchingDetails, setIsFetchingDetails] = useState(false)

  useEffect(() => {
    const fetchJobHistory = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/jobs', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setJobs(data.data || [])
        setFilteredJobs(data.data || [])
      } catch (err) {
        console.error('Error fetching jobs:', err)
        setError('Failed to load jobs. Please try again later.')
        toast.error('Failed to load jobs')
      } finally {
        setLoading(false)
      }
    }

    fetchJobHistory()
  }, [])

  // Filter jobs based on search term and status
  useEffect(() => {
    let filtered = jobs
    
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(job => 
        job.job_number.toLowerCase().includes(term) ||
        job.customer_name.toLowerCase().includes(term) ||
        (job.scale_make && job.scale_make.toLowerCase().includes(term)) ||
        (job.scale_model && job.scale_model.toLowerCase().includes(term)) ||
        (job.scale_serial && job.scale_serial.toLowerCase().includes(term))
      )
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter)
    }
    
    setFilteredJobs(filtered)
  }, [searchTerm, statusFilter, jobs])

  const handleRefresh = () => {
    setJobs([])
    setFilteredJobs([])
    setLoading(true)
    setError(null)
    setSearchTerm('')
    setStatusFilter('all')
    
    const fetchJobHistory = async () => {
      try {
        const response = await fetch('/api/jobs', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setJobs(data.data || [])
        setFilteredJobs(data.data || [])
      } catch (err) {
        console.error('Error refreshing jobs:', err)
        setError('Failed to refresh jobs. Please try again later.')
        toast.error('Failed to refresh jobs')
      } finally {
        setLoading(false)
      }
    }

    fetchJobHistory()
  }

  const handleViewDetails = async (jobId: number) => {
    try {
      setIsFetchingDetails(true)
      setError(null)

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
      ])

      // Process job data
      if (!jobResponse.ok) throw new Error('Failed to fetch job details')
      const jobData = await jobResponse.json()
      setSelectedJob(jobData)

      // Process quotation data
      let quotationData = null
      if (quotationResponse.ok) {
        const quotations = await quotationResponse.json()
        quotationData = quotations && Array.isArray(quotations.data) && quotations.data.length > 0 ? quotations.data[0] : null
      }
      setSelectedQuotation(quotationData)

      // Process inspection data
      let inspectionWithParts = null
      if (inspectionResponse.ok) {
        const inspections = await inspectionResponse.json()
        const inspection = Array.isArray(inspections) ? inspections[0] : inspections

        if (inspection) {
          // Fetch spare parts
          const partsResponse = await fetch(`/api/jobs/inspections/${inspection.id}/spare-parts`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          })
          const spareParts = partsResponse.ok ? await partsResponse.json() : []

          // Ensure spareParts is an array before using it in reduce
          const safeSpareParts = Array.isArray(spareParts) ? spareParts : []

          inspectionWithParts = {
            ...inspection,
            spare_parts: safeSpareParts,
            total_cost: safeSpareParts.reduce(
              (sum: number, part: SparePart) => sum + (part.quantity * part.unit_price),
              inspection.total_cost || 0
            )
          }
        }
      }
      setSelectedInspection(inspectionWithParts)

      // Process approval data
      let approvalData = null
      if (approvalResponse.ok) {
        const approvals = await approvalResponse.json()
        approvalData = approvals && Array.isArray(approvals.data) && approvals.data.length > 0 ? approvals.data[0] : null
      }
      setSelectedApproval(approvalData)

      setIsDetailsModalOpen(true)
    } catch (err) {
      console.error('Error loading job details:', err)
      setError(err instanceof Error ? err.message : 'Failed to load job details')
      toast.error('Failed to load job details')
    } finally {
      setIsFetchingDetails(false)
    }
  }

  const handleUpdate = () => {
    // Refresh the job details
    if (selectedJob) {
      handleViewDetails(selectedJob.id)
    }
  }

  const handlePrint = () => {
    const printContent = document.getElementById('printable-area')
    const originalContents = document.body.innerHTML
    
    // Get current filter information
    const filterInfo = statusFilter !== 'all' 
      ? `<p class="mb-2"><strong>Filter:</strong> ${statusLabels[statusFilter]}</p>`
      : ''
    
    const searchInfo = searchTerm 
      ? `<p class="mb-2"><strong>Search:</strong> "${searchTerm}"</p>`
      : ''

    document.body.innerHTML = `
      <div class="p-4">
        <h1 class="text-2xl font-bold mb-2">Job History Report</h1>
        ${filterInfo}
        ${searchInfo}
        <div class="mt-2 mb-4">
          ${printContent?.innerHTML || ''}
        </div>
        <div class="mt-4 text-sm text-gray-500">
          Printed on: ${new Date().toLocaleString()}
        </div>
      </div>
    `
    
    window.print()
    document.body.innerHTML = originalContents
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">Job History</CardTitle>
            <CardDescription className="mt-1">
              {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'} found
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search jobs..."
                className="pl-9 w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={(value: JobStatus | 'all') => setStatusFilter(value)}>
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Filter by status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(statusLabels).map(([status, label]) => (
                    <SelectItem key={status} value={status as JobStatus}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleRefresh} disabled={loading}>
                Refresh
              </Button>
              <Button 
                variant="outline" 
                onClick={handlePrint}
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-destructive">
            <div className="text-xl font-medium mb-2">Error loading job history</div>
            <div className="text-sm mb-4">{error}</div>
            <Button variant="outline" onClick={handleRefresh}>
              Try Again
            </Button>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Clock className="h-12 w-12 mb-4" />
            <div className="text-xl font-medium">
              {searchTerm || statusFilter !== 'all' 
                ? 'No matching jobs found' 
                : 'No job history available'}
            </div>
            {(searchTerm || statusFilter !== 'all') && (
              <Button 
                variant="ghost" 
                className="mt-4" 
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div id="printable-area" className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredJobs.map((job) => (
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
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[job.status]}`}>
                        {statusLabels[job.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(job.id)}
                        disabled={isFetchingDetails && selectedJob?.id === job.id}
                      >
                        {isFetchingDetails && selectedJob?.id === job.id ? (
                          <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        ) : (
                          'View Details'
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <JobDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        job={selectedJob}
        inspection={selectedInspection}
        quotation={selectedQuotation}
        approval={selectedApproval}
        isLoading={isFetchingDetails}
        onUpdate={handleUpdate}
      />
    </Card>
  )
}