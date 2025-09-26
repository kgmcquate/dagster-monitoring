import React from 'react';

interface StatsCardProps {
  title: string;
  value: number;
  subtitle: string;
  color: 'blue' | 'green' | 'yellow' | 'red';
}

const colorStyles = {
  blue: { color: 'var(--color-accent-blue)' },
  green: { color: 'var(--color-accent-green)' },
  yellow: { color: 'var(--color-accent-yellow)' },
  red: { color: 'var(--color-accent-red)' },
};

export default function StatsCard({ title, value, subtitle, color }: StatsCardProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-light)' }}>{title}</p>
          <p className="text-3xl font-bold" style={colorStyles[color]}>
            {value.toLocaleString()}
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-lighter)' }}>{subtitle}</p>
        </div>
      </div>
    </div>
  );
}