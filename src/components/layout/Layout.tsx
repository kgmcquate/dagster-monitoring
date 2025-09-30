import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  CubeIcon, 
  ClipboardDocumentListIcon,
  EyeIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ChevronLeftIcon
} from '@heroicons/react/24/outline';
import { DAGIcon } from '../ui/DAGIcon';

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Assets', href: '/assets', icon: CubeIcon },
  { name: 'Materializations', href: '/materializations', icon: ClipboardDocumentListIcon },
  { name: 'Observations', href: '/observations', icon: EyeIcon },
  { name: 'Checks', href: '/checks', icon: CheckCircleIcon },
];

// function classNames(...classes: string[]) {
//   return classes.filter(Boolean).join(' ');
// }

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div 
      className="min-h-screen" 
      style={{ 
        backgroundColor: 'var(--color-background-default)',
        '--sidebar-width': sidebarCollapsed ? '4rem' : '16rem'
      } as React.CSSProperties}
    >
      <div className="flex">
        {/* Sidebar */}
        <div 
          className={`flex-shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`} 
          style={{ backgroundColor: 'var(--color-background-light)', borderRight: '1px solid var(--color-border-default)' }}
        >
          <div className="flex flex-col h-screen">
            {/* Header */}
            <div 
              className={`flex items-center h-16 ${sidebarCollapsed ? 'px-3 justify-center flex-col' : 'px-6 justify-between'}`}
              style={{ backgroundColor: 'var(--color-background-lighter)', borderBottom: '1px solid var(--color-border-default)' }}
            >
              {sidebarCollapsed ? (
                /* Collapsed layout - stacked vertically */
                <div className="flex flex-row items-center ml-4">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-accent-blue)' }}
                  >
                    <DAGIcon className="w-6 h-6 text-white" />
                  </div>
                  <button
                    onClick={toggleSidebar}
                    className=" rounded-md hover:bg-opacity-20 hover:bg-gray-500 transition-colors"
                    style={{ color: 'var(--color-text-lighter)' }}
                    title="Expand sidebar"
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Expanded layout - horizontal */
                <>
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'var(--color-accent-blue)' }}
                    >
                      <DAGIcon className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-m font-semibold truncate" style={{ color: 'var(--color-text-default)' }}>
                      Dagster Monitor
                    </h1>
                  </div>
                  <button
                    onClick={toggleSidebar}
                    className="p-1 rounded-md hover:bg-opacity-20 hover:bg-gray-500 transition-colors"
                    style={{ color: 'var(--color-text-lighter)' }}
                    title="Collapse sidebar"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`nav-link group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive ? 'active' : ''
                    } ${sidebarCollapsed ? 'justify-center' : ''}`}
                    style={{
                      color: isActive ? 'var(--color-accent-blue)' : 'var(--color-text-light)',
                      backgroundColor: isActive ? 'rgba(79, 67, 221, 0.1)' : 'transparent',
                    }}
                    title={sidebarCollapsed ? item.name : ''}
                  >
                    <item.icon
                      className={`h-5 w-5 transition-colors ${sidebarCollapsed ? '' : 'mr-3'}`}
                      style={{
                        color: isActive ? 'var(--color-accent-blue)' : 'var(--color-text-lighter)'
                      }}
                      aria-hidden="true"
                    />
                    {!sidebarCollapsed && item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-h-screen overflow-auto">
          <main className="p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}