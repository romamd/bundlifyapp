import React from 'react';

interface MarginBadgeProps {
  marginPct: number | null;
}

export function MarginBadge({ marginPct }: MarginBadgeProps) {
  if (marginPct === null) {
    return (
      <span
        style={{
          padding: '2px 8px',
          borderRadius: '4px',
          backgroundColor: '#e4e5e7',
          color: '#6d7175',
          fontSize: '12px',
        }}
      >
        No COGS
      </span>
    );
  }

  let backgroundColor: string;
  let color: string;

  if (marginPct >= 30) {
    backgroundColor = '#aee9d1';
    color = '#1a5632';
  } else if (marginPct >= 15) {
    backgroundColor = '#ffea8a';
    color = '#6a5c00';
  } else {
    backgroundColor = '#ffd2d2';
    color = '#8c1a1a';
  }

  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: '4px',
        backgroundColor,
        color,
        fontSize: '12px',
        fontWeight: 600,
      }}
    >
      {marginPct.toFixed(1)}%
    </span>
  );
}
