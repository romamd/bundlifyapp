import React, { useState } from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  size?: 'sm' | 'md';
  type?: 'button' | 'submit';
  'aria-label'?: string;
  style?: React.CSSProperties;
}

const VARIANTS = {
  primary: {
    bg: '#008060',
    bgHover: '#006e52',
    bgActive: '#005a45',
    color: '#ffffff',
    border: 'none',
    fontWeight: 600,
  },
  secondary: {
    bg: '#ffffff',
    bgHover: '#f6f6f7',
    bgActive: '#edeeef',
    color: '#202223',
    border: '1px solid #c9cccf',
    fontWeight: 400,
  },
  danger: {
    bg: '#ffffff',
    bgHover: '#fff5f5',
    bgActive: '#ffd2d2',
    color: '#8c1a1a',
    border: '1px solid #fecaca',
    fontWeight: 500,
  },
  ghost: {
    bg: 'transparent',
    bgHover: '#f6f6f7',
    bgActive: '#edeeef',
    color: '#5c5f62',
    border: 'none',
    fontWeight: 400,
  },
};

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  size = 'md',
  type = 'button',
  style,
  ...rest
}: ButtonProps) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const v = VARIANTS[variant];

  const padding = size === 'sm' ? '6px 14px' : '8px 16px';
  const fs = size === 'sm' ? '13px' : '14px';

  const bg = disabled
    ? '#e4e5e7'
    : pressed
      ? v.bgActive
      : hovered
        ? v.bgHover
        : v.bg;

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      aria-label={rest['aria-label']}
      style={{
        padding,
        backgroundColor: bg,
        color: disabled ? '#6d7175' : v.color,
        border: v.border,
        borderRadius: '4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: fs,
        fontWeight: v.fontWeight,
        transition: 'background-color 0.15s ease, transform 0.1s ease',
        transform: pressed && !disabled ? 'scale(0.98)' : 'scale(1)',
        lineHeight: '1.4',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
