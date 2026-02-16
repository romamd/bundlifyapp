import React from 'react';

interface EmptyStateProps {
  heading: string;
  message: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ heading, message, action }: EmptyStateProps) {
  return (
    <div style={{ padding: '60px 40px', textAlign: 'center' }}>
      <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>{heading}</h2>
      <p style={{ color: '#6d7175', marginBottom: '16px' }}>{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            padding: '8px 20px',
            backgroundColor: '#008060',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
