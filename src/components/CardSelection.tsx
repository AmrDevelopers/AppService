import { Link } from 'react-router-dom';
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
  ClipboardList
} from 'lucide-react';

const cards = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, color: 'bg-blue-100 text-blue-600' },
  { name: 'Create Job', href: '/jobs/create', icon: PlusCircle, color: 'bg-green-100 text-green-600' },
  { name: 'Inspection', href: '/jobs/inspection', icon: Wrench, color: 'bg-yellow-100 text-yellow-600' },
  { name: 'Service Reports', href: '/service-reports/new', icon: ClipboardList, color: 'bg-purple-100 text-purple-600' },
  // Add more cards as needed
];

export default function CardSelection() {
  if (!isMobileApp()) return null;

  return (
    <div className="p-4 grid grid-cols-2 gap-4">
      {cards.map((card) => (
        <Link
          key={card.name}
          to={card.href}
          className={`flex flex-col items-center justify-center p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow ${card.color}`}
        >
          <card.icon className="h-8 w-8 mb-2" />
          <span className="font-medium">{card.name}</span>
        </Link>
      ))}
    </div>
  );
}