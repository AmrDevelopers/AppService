import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';
import { isMobileApp } from '../utils/environment';
import {
  BarChart3,
  ClipboardCheck,
  CheckCircle,
  Truck,
  FileText,
  Loader2,
  Eye,
  Edit,
  PlusCircle,
  ArrowLeft,
} from 'lucide-react';

interface DashboardStats {
  pending_inspection: number;
  pending_quotation: number;
  pending_approval: number;
  approved: number;
  ready_for_delivery: number;
  completed: number;
}

interface Job {
  id: number;
  job_number: string;
  status: keyof typeof statusIcons;
  customer_name: string;
  created_at: string;
}

const statusIcons = {
  pending_inspection: FileText,
  pending_quotation: ClipboardCheck,
  pending_approval: BarChart3,
  approved: CheckCircle,
  ready_for_delivery: Truck,
  completed: CheckCircle,
};

const statusTitles = {
  pending_inspection: 'Pending Inspections',
  pending_quotation: 'Pending Quotations',
  pending_approval: 'Pending Approvals',
  approved: 'Approved Jobs',
  ready_for_delivery: 'Ready for Delivery',
  completed: 'Completed Jobs',
};

const bgColorMap = {
  pending_inspection: 'from-blue-50 hover:from-blue-100',
  pending_quotation: 'from-yellow-50 hover:from-yellow-100',
  pending_approval: 'from-purple-50 hover:from-purple-100',
  approved: 'from-green-50 hover:from-green-100',
  ready_for_delivery: 'from-teal-50 hover:from-teal-100',
  completed: 'from-gray-50 hover:from-gray-100',
};

const iconBgMap = {
  pending_inspection: 'bg-blue-100 text-blue-600',
  pending_quotation: 'bg-yellow-100 text-yellow-600',
  pending_approval: 'bg-purple-100 text-purple-600',
  approved: 'bg-green-100 text-green-600',
  ready_for_delivery: 'bg-teal-100 text-teal-600',
  completed: 'bg-gray-100 text-gray-600',
};

const badgeColorMap = {
  pending_inspection: 'bg-blue-100 text-blue-700',
  pending_quotation: 'bg-yellow-100 text-yellow-700',
  pending_approval: 'bg-purple-100 text-purple-700',
  approved: 'bg-green-100 text-green-700',
  ready_for_delivery: 'bg-teal-100 text-teal-700',
  completed: 'bg-gray-100 text-gray-700',
};

function StatusCard({
  statusKey,
  count,
  onClick,
}: {
  statusKey: keyof typeof statusIcons;
  count: number;
  onClick: () => void;
}) {
  const Icon = statusIcons[statusKey];
  return (
    <div
      onClick={onClick}
      className={`p-6 rounded-2xl shadow-xl cursor-pointer transition-all border border-gray-100 bg-gradient-to-br to-white hover:shadow-2xl ${bgColorMap[statusKey]}`}
    >
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-medium text-gray-600">{statusTitles[statusKey]}</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">{count}</p>
        </div>
        <div className={`p-3 rounded-full shadow-inner ${iconBgMap[statusKey]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const location = useLocation();
  const [showJobList, setShowJobList] = useState<keyof typeof statusIcons | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await axios.get('/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      return response.data.data;
    },
  });

  const { data: jobsResponse, isLoading: jobsLoading } = useQuery<{ success: boolean; data: Job[] }>({
    queryKey: ['jobs', showJobList],
    queryFn: async () => {
      const response = await axios.get(`/api/dashboard/jobs?status=${showJobList}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      return response.data;
    },
    enabled: !!showJobList,
  });

  const handleCardClick = (status: keyof typeof statusIcons) => {
    setShowJobList(prev => (prev === status ? null : status));
  };

  const renderJobList = () => {
    const jobs = jobsResponse?.data;
    if (jobsLoading) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
        </div>
      );
    }

    if (!jobs || jobs.length === 0) {
      return <p className="text-gray-500 text-center py-8">No jobs found</p>;
    }

    return (
      <div className="overflow-x-auto rounded-xl shadow-inner mt-8">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase">Date</th>
              <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase">Job Number</th>
              <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase">Customer</th>
              <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase">Status</th>
              <th className="px-6 py-3 text-right font-medium text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {jobs.map((job) => (
              <tr key={job.id}>
                <td className="px-6 py-4 text-gray-500">
                  {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 font-semibold text-gray-800">#{job.job_number}</td>
                <td className="px-6 py-4 text-gray-600">{job.customer_name}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${badgeColorMap[job.status]}`}>
                    {job.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link to={`/jobs/${job.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                    <Eye className="w-4 h-4 inline-block mr-1" /> Preview
                  </Link>
                  <Link to={`/jobs/edit/${job.id}`} className="text-blue-600 hover:text-blue-900">
                    <Edit className="w-4 h-4 inline-block mr-1" /> Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Show Quick Access cards for mobile app homepage
  if (isMobileApp() && location.pathname === '/') {
    return (
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Quick Access</h1>
        <div className="grid grid-cols-2 gap-4">
          <Link
            to="/dashboard-full"
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-600"
          >
            <BarChart3 className="h-6 w-6 mb-2" />
            <span className="font-medium text-sm text-center">Dashboard Stats</span>
          </Link>
          <Link
            to="/jobs/create"
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-green-100 hover:bg-green-200 text-green-600"
          >
            <PlusCircle className="h-6 w-6 mb-2" />
            <span className="font-medium text-sm text-center">Create Job</span>
          </Link>
        </div>
      </div>
    );
  }

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {isMobileApp() && (
        <Link to="/" className="flex items-center text-blue-600 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Menu
        </Link>
      )}
      <h1 className="text-4xl font-extrabold text-gray-800 mb-10 tracking-tight">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.keys(statusIcons).map((key) => {
          const statusKey = key as keyof typeof statusIcons;
          return (
            <StatusCard
              key={statusKey}
              statusKey={statusKey}
              count={stats?.[statusKey] || 0}
              onClick={() => handleCardClick(statusKey)}
            />
          );
        })}
      </div>

      {showJobList && (
        <>
          <h2 className="text-2xl font-semibold text-gray-700 mt-12 mb-4">{statusTitles[showJobList]}</h2>
          {renderJobList()}
        </>
      )}
    </div>
  );
}

export default Dashboard;
