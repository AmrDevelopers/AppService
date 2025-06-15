import { useAuth } from '../contexts/AuthContext';
import { Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth();





  return (
    <header className="sticky top-0 z-10 bg-blue-600 border-b border-blue-700 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <button
              type="button"
              className="text-white hover:text-gray-200"
              onClick={onMenuClick}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" />
            </button>
          </div>

          {/* Spacer to center user info on mobile */}
          <div className="flex-1 lg:hidden"></div>

          {/* User profile info */}
          <div className="flex items-center gap-x-4">
            <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-blue-700" aria-hidden="true" />
            <div className="flex items-center">
              <span className="text-sm font-medium text-white">{user?.name}</span>
              <span className="ml-2 text-sm text-gray-200">({user?.role})</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}