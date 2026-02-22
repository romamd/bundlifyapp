import React from 'react';

interface EmptyStateProps {
  heading: string;
  message: string;
  icon?: 'bundle' | 'chart' | 'product' | 'settings' | 'search';
  action?: { label: string; onClick: () => void };
}

const ICONS: Record<string, React.ReactNode> = {
  bundle: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="6" y="14" width="36" height="26" rx="4" stroke="#c9cccf" strokeWidth="2" fill="#f6f6f7" />
      <path d="M6 18h36" stroke="#c9cccf" strokeWidth="2" />
      <rect x="12" y="8" width="24" height="6" rx="2" stroke="#c9cccf" strokeWidth="2" fill="#fff" />
      <path d="M20 26h8M20 32h8" stroke="#008060" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  chart: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="8" y="28" width="6" height="12" rx="1" fill="#c9cccf" />
      <rect x="17" y="20" width="6" height="20" rx="1" fill="#c9cccf" />
      <rect x="26" y="14" width="6" height="26" rx="1" fill="#008060" />
      <rect x="35" y="22" width="6" height="18" rx="1" fill="#c9cccf" />
      <path d="M6 42h36" stroke="#e1e3e5" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  product: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="8" y="8" width="32" height="32" rx="4" stroke="#c9cccf" strokeWidth="2" fill="#f6f6f7" />
      <circle cx="24" cy="22" r="8" stroke="#008060" strokeWidth="2" fill="none" />
      <path d="M14 36h20" stroke="#c9cccf" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  settings: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="8" stroke="#c9cccf" strokeWidth="2" fill="#f6f6f7" />
      <circle cx="24" cy="24" r="3" fill="#008060" />
      <path d="M24 8v4M24 36v4M8 24h4M36 24h4M12.7 12.7l2.8 2.8M32.5 32.5l2.8 2.8M35.3 12.7l-2.8 2.8M15.5 32.5l-2.8 2.8" stroke="#c9cccf" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  search: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="22" cy="22" r="10" stroke="#c9cccf" strokeWidth="2" fill="#f6f6f7" />
      <path d="M29.5 29.5L38 38" stroke="#c9cccf" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 22h8" stroke="#008060" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

export function EmptyState({ heading, message, icon, action }: EmptyStateProps) {
  return (
    <div style={{ padding: '60px 40px', textAlign: 'center' }}>
      {icon && ICONS[icon] && (
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
          {ICONS[icon]}
        </div>
      )}
      <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: '#202223' }}>{heading}</h2>
      <p style={{ color: '#5c5f62', marginBottom: '16px', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          aria-label={action.label}
          style={{
            padding: '8px 20px',
            backgroundColor: '#008060',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => { (e.target as HTMLElement).style.backgroundColor = '#006e52'; }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.backgroundColor = '#008060'; }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
