import { ApolloError } from '@apollo/client';

interface ErrorMessageProps {
  error: ApolloError;
}

export default function ErrorMessage({ error }: ErrorMessageProps) {
  return (
    <div 
      className="rounded-lg p-4 border"
      style={{ 
        backgroundColor: 'rgba(210, 66, 53, 0.1)', 
        borderColor: 'rgba(210, 66, 53, 0.3)' 
      }}
    >
      <div className="flex">
        <div className="ml-3">
          <h3 className="text-sm font-medium" style={{ color: 'var(--color-accent-red)' }}>
            Error loading data
          </h3>
          <div className="mt-2 text-sm" style={{ color: 'var(--color-text-light)' }}>
            <p>{error.message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}