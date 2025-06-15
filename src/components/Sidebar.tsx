import { Link, useLocation } from 'react-router-dom';
import { isMobileApp } from '../utils/environment';
import {
  LayoutDashboard,
  PlusCircle,
  Wrench,
  FileText,
  Clock,
  CheckCircle2,
  Truck,
  History,
  Users,
  LogOut,
  X,
  ClipboardList, // Added for Service Reports
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Task Management', href: '/tasks', icon: Wrench },
  { name: 'Calibration Job Request', href: '/calibration-job-request', icon: PlusCircle },
  { name: 'Create Job', href: '/jobs/create', icon: PlusCircle },
  { name: 'Inspection', href: '/jobs/inspection', icon: Wrench },
  { name: 'Quotation', href: '/jobs/quotation', icon: FileText },
  { name: 'Pending Approval', href: '/jobs/pending-approval', icon: Clock },
  { name: 'Approved Jobs', href: '/jobs/approved', icon: CheckCircle2 },
  { name: 'Ready for Delivery', href: '/jobs/ready-for-delivery', icon: Truck },
  { name: 'Job History', href: '/jobs/history', icon: History },
  { name: 'User Management', href: '/users', icon: Users },
  // Add this new entry for Service Reports
  { name: 'Service Reports', href: '/service-reports/new', icon: ClipboardList },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { logout } = useAuth();

   if (isMobileApp()) return null;

  // Check if path starts with /service-reports for active state
  const isServiceReportsActive = location.pathname.startsWith('/service-reports');

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 w-72 h-screen transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 bg-background/90 backdrop-blur-lg shadow-2xl`}
      >
        <div className="flex flex-col h-full px-4 py-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 px-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              <span className="text-accent">Scale</span>
              <span className="text-white">Service</span>
            </h1>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white lg:hidden transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                // Special handling for service reports active state
                const isActive = item.href === '/service-reports/new' 
                  ? isServiceReportsActive 
                  : location.pathname === item.href;

                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition
                        ${isActive
                          ? 'bg-gradient-to-r from-primary to-accent text-white shadow'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      <Icon
                        className={`h-5 w-5 transition 
                        ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}
                      />
                      <span>{item.name}</span>
                      {isActive && (
                        <span className="ml-auto h-2 w-2 bg-white rounded-full"></span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Divider */}
          <div className="mt-6 border-t border-white/10" />

          {/* Logout */}
          <button
            onClick={logout}
            className="mt-4 flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover:bg-red-600 hover:text-white rounded-lg transition"
          >
            <LogOut className="h-5 w-5 text-gray-400 group-hover:text-white" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}