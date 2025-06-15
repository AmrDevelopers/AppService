import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Form, Input, DatePicker, Select, message, Tooltip, Divider } from 'antd';
import { InfoCircleOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import CustomerDropdown from '../components/customer-dropdown';
import type { Customer } from '../types';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const TaskForm = () => {
  const [form] = Form.useForm();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [jobTypes, setJobTypes] = useState([]);
  const [informedBy, setInformedBy] = useState([]);
  const [salespersons, setSalespersons] = useState([]);
  const [jobPriorities, setJobPriorities] = useState([]);
  const [isCustomerModalVisible, setIsCustomerModalVisible] = useState(false);
  const [isJobTypeModalVisible, setIsJobTypeModalVisible] = useState(false);
  const [isInformedModalVisible, setIsInformedModalVisible] = useState(false);
  const [isSalespersonModalVisible, setIsSalespersonModalVisible] = useState(false);
  const [isPriorityModalVisible, setIsPriorityModalVisible] = useState(false);
  // Import modal state removed as it's not used with the new CustomerDropdown
  const [newCustomer, setNewCustomer] = useState({ name: '', address: '' });
  const [newJobType, setNewJobType] = useState({ name: '', description: '' });
  const [newInformedBy, setNewInformedBy] = useState({ name: '' });
  const [newSalesperson, setNewSalesperson] = useState({ name: '', email: '', phone: '' });
  const [newPriority, setNewPriority] = useState({ name: '', level: '' });
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: number; name: string; address?: string } | null>(null);
  const [selectedSalesperson, setSelectedSalesperson] = useState(null);
  const [taskNumber, setTaskNumber] = useState('');

  useEffect(() => {
    // Generate task number
    generateTaskNumber();
    // Fetch initial data
    fetchInitialData();
  }, []);

  const generateTaskNumber = () => {
    const prefix = 'TASK';
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setTaskNumber(`${prefix}-${randomNum}`);
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/customers');
      setCustomers(response.data);
      setFilteredCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      message.error('Failed to load customers');
    }
  };

  const fetchInitialData = async () => {
    try {
      const [custRes, jobRes, infRes, salesRes, priRes] = await Promise.all([
        axios.get('/api/customers'),
        axios.get('/api/job-types'),
        axios.get('/api/informed-by'),
        axios.get('/api/salespersons'),
        axios.get('/api/job-priorities')
      ]);
      
      setCustomers(custRes.data);
      setFilteredCustomers(custRes.data);
      setJobTypes(jobRes.data);
      setInformedBy(infRes.data);
      setSalespersons(salesRes.data);
      setJobPriorities(priRes.data);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      message.error('Failed to load initial data');
    }
  };

  const handleSalespersonChange = (value) => {
    setSelectedSalesperson(value);
    if (value) {
      const filtered = customers.filter(customer => customer.salesperson_id === value);
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
    form.setFieldsValue({ customer: undefined });
  };

  const handleSubmit = async (values) => {
    try {
      const taskData = {
        task_number: taskNumber,
        date: values.date.format('YYYY-MM-DD'),
        committed_date: values.committed_date.format('YYYY-MM-DD'),
        customer_id: values.customer,
        job_type_id: values.job_type,
        job_description: values.job_description,
        informed_by_id: values.informed_by,
        salesperson_id: values.salesperson,
        job_priority_id: values.job_priority,
        additional_notes: values.additional_notes,
        address: values.address
      };
      
      await axios.post('/api/tasks', taskData);
      message.success('Task created successfully!');
      form.resetFields();
      generateTaskNumber();
    } catch (error) {
      console.error('Error creating task:', error);
      message.error('Failed to create task');
    }
  };

  // Modal handlers for adding new entries
  const handleAddCustomer = async () => {
    try {
      const response = await axios.post('/api/customers', newCustomer);
      setCustomers([...customers, response.data]);
      setFilteredCustomers([...filteredCustomers, response.data]);
      setIsCustomerModalVisible(false);
      setNewCustomer({ name: '', address: '' });
      message.success('Customer added successfully!');
    } catch (error) {
      console.error('Error adding customer:', error);
      message.error('Failed to add customer');
    }
  };

  const handleAddJobType = async () => {
    try {
      const response = await axios.post('/api/job-types', newJobType);
      setJobTypes([...jobTypes, response.data]);
      setIsJobTypeModalVisible(false);
      setNewJobType({ name: '', description: '' });
      message.success('Job type added successfully!');
    } catch (error) {
      console.error('Error adding job type:', error);
      message.error('Failed to add job type');
    }
  };

  const handleAddInformedBy = async () => {
    try {
      const response = await axios.post('/api/informed-by', newInformedBy);
      setInformedBy([...informedBy, response.data]);
      setIsInformedModalVisible(false);
      setNewInformedBy({ name: '' });
      message.success('Informed by entry added successfully!');
    } catch (error) {
      console.error('Error adding informed by entry:', error);
      message.error('Failed to add entry');
    }
  };

  const handleAddSalesperson = async () => {
    try {
      const response = await axios.post('/api/salespersons', newSalesperson);
      setSalespersons([...salespersons, response.data]);
      setIsSalespersonModalVisible(false);
      setNewSalesperson({ name: '', email: '', phone: '' });
      message.success('Salesperson added successfully!');
    } catch (error) {
      console.error('Error adding salesperson:', error);
      message.error('Failed to add salesperson');
    }
  };

  const handleAddPriority = async () => {
    try {
      const response = await axios.post('/api/job-priorities', {
        ...newPriority,
        level: parseInt(newPriority.level)
      });
      setJobPriorities([...jobPriorities, response.data]);
      setIsPriorityModalVisible(false);
      setNewPriority({ name: '', level: '' });
      message.success('Priority added successfully!');
    } catch (error) {
      console.error('Error adding priority:', error);
      message.error('Failed to add priority');
    }
  };

  return (
    <div className="task-form-container">
      <h1>Create New Task</h1>
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          date: dayjs(),
          committed_date: dayjs()
        }}
      >
        {/* Task Number */}
        <Form.Item label="Task Number">
          <Input value={taskNumber} readOnly />
        </Form.Item>
        
        {/* Date */}
        <Form.Item 
          label="Date" 
          name="date"
          rules={[{ required: true, message: 'Please select a date' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        
        {/* Committed Date */}
        <Form.Item 
          label="Committed Date" 
          name="committed_date"
          rules={[{ required: true, message: 'Please select a committed date' }]}
          tooltip={{ title: 'Select a future date if needed', icon: <InfoCircleOutlined /> }}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        
        {/* Customer Selection */}
        <Form.Item 
          label="Customer" 
          name="customer"
          rules={[{ required: true, message: 'Please select a customer' }]}
        >
          <div>
            <CustomerDropdown
              selectedCustomer={selectedCustomer}
              onSelectCustomer={(customer) => {
                setSelectedCustomer(customer);
                form.setFieldsValue({ 
                  customer: customer.id,
                  address: customer.address || '' 
                });
              }}
              onCreateCustomer={() => setIsCustomerModalVisible(true)}
              onEditCustomer={(customer) => {
                setSelectedCustomer(customer);
                form.setFieldsValue({ 
                  customer: customer.id,
                  address: customer.address || '' 
                });
              }}
            />
          </div>
        </Form.Item>
        
        {/* Address (editable when customer is selected) */}
        <Form.Item 
          label="Address" 
          name="address"
          rules={[{ required: true, message: 'Please enter the address' }]}
        >
          <TextArea 
            rows={3} 
            disabled={!selectedCustomer}
            placeholder={selectedCustomer ? 'Edit address if needed' : 'Select a customer first'}
          />
        </Form.Item>
        
        {/* Job Type */}
        <Form.Item 
          label="Job Type" 
          name="job_type"
          rules={[{ required: true, message: 'Please select a job type' }]}
        >
          <Select
            popupRender={menu => (
              <div>
                {menu}
                <Divider style={{ margin: '4px 0' }} />
                <div style={{ padding: '8px', cursor: 'pointer' }}>
                  <Button 
                    type="text" 
                    icon={<PlusOutlined />} 
                    onClick={() => setIsJobTypeModalVisible(true)}
                  >
                    Add New Job Type
                  </Button>
                </div>
              </div>
            )}
          >
            {jobTypes.map(jobType => (
              <Option key={jobType.id} value={jobType.id}>
                {jobType.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
        
        {/* Job Description */}
        <Form.Item 
          label="Job Description" 
          name="job_description"
          rules={[{ required: true, message: 'Please enter job description' }]}
        >
          <TextArea rows={4} />
        </Form.Item>
        
        {/* Informed By */}
        <Form.Item 
          label="Informed By" 
          name="informed_by"
          rules={[{ required: true, message: 'Please select who informed about the job' }]}
        >
          <Select
            popupRender={menu => (
              <div>
                {menu}
                <Divider style={{ margin: '4px 0' }} />
                <div style={{ padding: '8px', cursor: 'pointer' }}>
                  <Button 
                    type="text" 
                    icon={<PlusOutlined />} 
                    onClick={() => setIsInformedModalVisible(true)}
                  >
                    Add New Entry
                  </Button>
                </div>
              </div>
            )}
          >
            {informedBy.map(item => (
              <Option key={item.id} value={item.id}>
                {item.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
        
        {/* Salesperson */}
        <Form.Item 
          label="Salesperson" 
          name="salesperson"
          rules={[{ required: true, message: 'Please select a salesperson' }]}
        >
          <Select
            onChange={handleSalespersonChange}
            popupRender={menu => (
              <div>
                {menu}
                <Divider style={{ margin: '4px 0' }} />
                <div style={{ padding: '8px', cursor: 'pointer' }}>
                  <Button 
                    type="text" 
                    icon={<PlusOutlined />} 
                    onClick={() => setIsSalespersonModalVisible(true)}
                  >
                    Add New Salesperson
                  </Button>
                </div>
              </div>
            )}
          >
            {salespersons.map(person => (
              <Option key={person.id} value={person.id}>
                {person.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
        
        {/* Job Priority */}
        <Form.Item 
          label="Job Priority" 
          name="job_priority"
          rules={[{ required: true, message: 'Please select job priority' }]}
        >
          <Select
            popupRender={menu => (
              <div>
                {menu}
                <Divider style={{ margin: '4px 0' }} />
                <div style={{ padding: '8px', cursor: 'pointer' }}>
                  <Button 
                    type="text" 
                    icon={<PlusOutlined />} 
                    onClick={() => setIsPriorityModalVisible(true)}
                  >
                    Add New Priority
                  </Button>
                </div>
              </div>
            )}
          >
            {jobPriorities.map(priority => (
              <Option key={priority.id} value={priority.id}>
                {priority.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
        
        {/* Additional Notes */}
        <Form.Item label="Additional Notes" name="additional_notes">
          <TextArea rows={3} />
        </Form.Item>
        
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Create Task
          </Button>
        </Form.Item>
      </Form>
      
      {/* Add Customer Modal */}
      <Modal
        title="Add New Customer"
        open={isCustomerModalVisible}
        onOk={handleAddCustomer}
        onCancel={() => setIsCustomerModalVisible(false)}
      >
        <Form layout="vertical">
          <Form.Item label="Customer Name" required>
            <Input 
              value={newCustomer.name} 
              onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} 
            />
          </Form.Item>
          <Form.Item label="Address">
            <TextArea 
              rows={3} 
              value={newCustomer.address} 
              onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} 
            />
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Add Job Type Modal */}
      <Modal
        title="Add New Job Type"
        open={isJobTypeModalVisible}
        onOk={handleAddJobType}
        onCancel={() => setIsJobTypeModalVisible(false)}
      >
        <Form layout="vertical">
          <Form.Item label="Job Type Name" required>
            <Input 
              value={newJobType.name} 
              onChange={e => setNewJobType({...newJobType, name: e.target.value})} 
            />
          </Form.Item>
          <Form.Item label="Description">
            <TextArea 
              rows={3} 
              value={newJobType.description} 
              onChange={e => setNewJobType({...newJobType, description: e.target.value})} 
            />
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Add Informed By Modal */}
      <Modal
        title="Add New Informed By"
        open={isInformedModalVisible}
        onOk={handleAddInformedBy}
        onCancel={() => setIsInformedModalVisible(false)}
      >
        <Form layout="vertical">
          <Form.Item label="Name" required>
            <Input 
              value={newInformedBy.name} 
              onChange={e => setNewInformedBy({...newInformedBy, name: e.target.value})} 
            />
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Add Salesperson Modal */}
      <Modal
        title="Add New Salesperson"
        open={isSalespersonModalVisible}
        onOk={handleAddSalesperson}
        onCancel={() => setIsSalespersonModalVisible(false)}
      >
        <Form layout="vertical">
          <Form.Item label="Name" required>
            <Input 
              value={newSalesperson.name} 
              onChange={e => setNewSalesperson({...newSalesperson, name: e.target.value})} 
            />
          </Form.Item>
          <Form.Item label="Email">
            <Input 
              type="email"
              value={newSalesperson.email} 
              onChange={e => setNewSalesperson({...newSalesperson, email: e.target.value})} 
            />
          </Form.Item>
          <Form.Item label="Phone">
            <Input 
              value={newSalesperson.phone} 
              onChange={e => setNewSalesperson({...newSalesperson, phone: e.target.value})} 
            />
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Add Priority Modal */}
      <Modal
        title="Add New Job Priority"
        open={isPriorityModalVisible}
        onOk={handleAddPriority}
        onCancel={() => setIsPriorityModalVisible(false)}
      >
        <Form layout="vertical">
          <Form.Item label="Priority Name" required>
            <Input 
              value={newPriority.name} 
              onChange={e => setNewPriority({...newPriority, name: e.target.value})} 
            />
          </Form.Item>
          <Form.Item label="Priority Level (number)" required>
            <Input 
              type="number"
              value={newPriority.level} 
              onChange={e => setNewPriority({...newPriority, level: e.target.value})} 
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Import functionality moved to CustomerDropdown component */}
    </div>
  );
};

export default TaskForm;