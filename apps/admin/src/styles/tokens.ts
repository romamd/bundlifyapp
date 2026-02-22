/** Design tokens — single source of truth for spacing, typography, colors */

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
} as const;

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const fontSize = {
  xs: 11,
  sm: 12,
  md: 13,
  base: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
} as const;

export const color = {
  text: '#202223',
  textSecondary: '#5c5f62',
  textTertiary: '#6d7175',
  border: '#e1e3e5',
  borderLight: '#f1f1f1',
  bg: '#ffffff',
  bgSubtle: '#f6f6f7',
  bgHover: '#f9fafb',
  primary: '#008060',
  primaryHover: '#006e52',
  primaryBg: '#f1f8f5',
  primaryBorder: '#aee9d1',
  danger: '#8c1a1a',
  dangerBg: '#ffd2d2',
  dangerBorder: '#fecaca',
  success: '#1a5632',
  successBg: '#dcfce7',
  warning: '#6a5c00',
  warningBg: '#fff8e5',
  warningBorder: '#ffea8a',
  inputBorder: '#c9cccf',
  disabled: '#e4e5e7',
  disabledText: '#6d7175',
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
} as const;

export const shadow = {
  sm: '0 1px 3px rgba(0,0,0,0.08)',
  md: '0 4px 12px rgba(0,0,0,0.12)',
  lg: '0 8px 32px rgba(0,0,0,0.12)',
} as const;
