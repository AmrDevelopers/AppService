// src/components/MobileNav.tsx
import { Link, useLocation } from 'react-router-dom';
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
  ClipboardList,
} from 'lucide-react';

const mobileNavigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Create', href: '/jobs/create', icon: PlusCircle },
  { name: 'Inspect', href: '/jobs/inspection', icon: Wrench },
  { name: 'Reports', href: '/service-reports/new', icon: ClipboardList },
  { name: 'History', href: '/jobs/history', icon: History },
];

export default function MobileNav() {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-gray-800 z-50">
      <div className="flex justify-around items-center py-2">
        {mobileNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href || 
                         (item.href === '/service-reports/new' && 
                          location.pathname.startsWith('/service-reports'));

          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center p-2 ${isActive ? 'text-primary' : 'text-gray-400'}`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}