import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';
import CardSelection from './CardSelection'; // Add this import
import { useState } from 'react';
import { isMobileApp } from '../utils/environment';
import { useLocation } from 'react-router-dom';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mobileApp = isMobileApp();
  const location = useLocation();

  // Show cards only on root path in mobile app
  const showCards = mobileApp && location.pathname === '/';

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar overlay - only show in web version */}
      {!mobileApp && sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - only show in web version */}
      {!mobileApp && (
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}
      
      {/* Main content area */}
      <div className={`${!mobileApp ? 'lg:pl-72' : ''} ${sidebarOpen && !mobileApp ? 'lg:ml-0' : ''}`}>
        {/* Header - only show in web version */}
        {!mobileApp && (
          <Header onMenuClick={() => setSidebarOpen(true)} />
        )}
        
        <main className={`py-4 px-4 sm:px-6 lg:px-8 ${mobileApp ? 'pb-16' : ''}`}>
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            {showCards ? (
              <CardSelection /> // Show cards on home screen for mobile
            ) : (
              <Outlet /> // Show regular content for other routes
            )}
          </div>
        </main>
      </div>

      {/* Mobile navigation - only show in mobile app */}
      {mobileApp && <MobileNav />}
    </div>
  );
}