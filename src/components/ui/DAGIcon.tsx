import React from 'react';

interface DAGIconProps {
  className?: string;
}

export const DAGIcon: React.FC<DAGIconProps> = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* DAG nodes */}
    <circle cx="5" cy="6" r="1" stroke="var(--color-accent-success)" />
    <circle cx="5" cy="18" r="1" stroke="var(--color-accent-warn)" />

    <circle cx="12" cy="2" r="1" stroke="var(--color-accent-success)" />
    <circle cx="12" cy="12" r="1" stroke="var(--color-accent-warn)" />
    <circle cx="12" cy="22" r="1" stroke="var(--color-accent-error)" />

    <circle cx="21" cy="12" r="1" stroke="var(--color-accent-error)" />
  
    {/* DAG edges */}
    <line x1="5" y1="6"  x2="12" y2="2" stroke="var(--color-accent-success)" strokeWidth="2" />
    <line x1="5" y1="6"  x2="12" y2="22" stroke="var(--color-accent-success)" strokeWidth="2" />
    <line x1="5" y1="18" x2="12" y2="22" stroke="var(--color-accent-warn)" strokeWidth="2" />
    <line x1="5" y1="18" x2="12" y2="11.5" stroke="var(--color-accent-warn)" strokeWidth="2" />

    <line x1="12" y1="2" x2="12" y2="12" stroke="var(--color-accent-success)" strokeWidth="2" />
    <line x1="12" y1="12" x2="21" y2="12" stroke="var(--color-accent-warn)" strokeWidth="2" />
    <line x1="12" y1="2" x2="21" y2="12" stroke="var(--color-accent-success)" strokeWidth="2" />

    <line x1="12" y1="22" x2="21" y2="12" stroke="var(--color-accent-error)" strokeWidth="2" />
  </svg>
);

export default DAGIcon;