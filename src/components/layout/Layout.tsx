import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  CubeIcon, 
  ClipboardDocumentListIcon,
  EyeIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

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

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background-default)' }}>
      <div className="flex">
        {/* Sidebar */}
        <div className="flex-shrink-0 w-64" style={{ backgroundColor: 'var(--color-background-light)', borderRight: '1px solid var(--color-border-default)' }}>
          <div className="flex flex-col h-screen">
            {/* Header */}
            <div 
              className="flex items-center justify-start h-16 px-6" 
              style={{ backgroundColor: 'var(--color-background-lighter)', borderBottom: '1px solid var(--color-border-default)' }}
            >
              <div className="flex items-center space-x-3">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--color-accent-blue)' }}
                >
                  <CubeIcon className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text-default)' }}>
                  Dagster Monitor
                </h1>
              </div>
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
                    }`}
                    style={{
                      color: isActive ? 'var(--color-accent-blue)' : 'var(--color-text-light)',
                      backgroundColor: isActive ? 'rgba(79, 67, 221, 0.1)' : 'transparent',
                    }}
                  >
                    <item.icon
                      className="mr-3 h-5 w-5 transition-colors"
                      style={{
                        color: isActive ? 'var(--color-accent-blue)' : 'var(--color-text-lighter)'
                      }}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            
            {/* Footer */}
            <div 
              className="p-4 border-t"
              style={{ borderColor: 'var(--color-border-default)' }}
            >
              <div className="text-xs" style={{ color: 'var(--color-text-disabled)' }}>
                Dagster Monitoring v1.0
              </div>
            </div>
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