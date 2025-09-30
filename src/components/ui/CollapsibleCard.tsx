import React, { useState } from 'react';

interface CollapsibleCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  title,
  description,
  children,
  defaultExpanded = true,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`card ${className}`}>
      <div 
        className="card-header cursor-pointer select-none hover:bg-color-background-lighter transition-colors duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 style={{ color: 'var(--color-text-default)' }}>{title}</h3>
            {description && (
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-lighter)' }}>
                {description}
              </p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0">
            <svg
              className={`w-5 h-5 text-color-text-lighter transition-transform duration-200 ${
                isExpanded ? 'transform rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>
      {isExpanded && (
        <div className="transition-all duration-200 ease-in-out">
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleCard;