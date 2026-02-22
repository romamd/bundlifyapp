import React from 'react';

export function LoadingState() {
  return (
    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <div
        style={{
          width: '32px',
          height: '32px',
          border: '3px solid #e1e3e5',
          borderTopColor: '#008060',
          borderRadius: '50%',
          animation: 'bundlify-spin 0.8s linear infinite',
        }}
      />
      <span style={{ fontSize: '13px', color: '#5c5f62' }}>Loading...</span>
    </div>
  );
}

export function SkeletonBlock({ width = '100%', height = 16 }: { width?: string | number; height?: number }) {
  return (
    <div
      style={{
        width,
        height: `${height}px`,
        borderRadius: '4px',
        background: 'linear-gradient(90deg, #e1e3e5 25%, #f0f0f0 50%, #e1e3e5 75%)',
        backgroundSize: '200% 100%',
        animation: 'bundlify-shimmer 1.5s ease-in-out infinite',
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div style={{ padding: '16px', border: '1px solid #e1e3e5', borderRadius: '8px', background: '#fff' }}>
      <SkeletonBlock width="60%" height={14} />
      <div style={{ height: '8px' }} />
      <SkeletonBlock width="40%" height={28} />
      <div style={{ height: '8px' }} />
      <SkeletonBlock width="80%" height={12} />
    </div>
  );
}
