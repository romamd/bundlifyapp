import React from 'react';

export const fieldRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 0',
  borderBottom: '1px solid #f1f1f1',
};

export const labelStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#202223',
};

export const sublabelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#6d7175',
  marginTop: '2px',
};

export const numberInputStyle: React.CSSProperties = {
  padding: '6px 10px',
  border: '1px solid #c9cccf',
  borderRadius: '4px',
  fontSize: '14px',
  width: '120px',
  textAlign: 'right' as const,
};

export const toggleStyle = (active: boolean): React.CSSProperties => ({
  width: '44px',
  height: '24px',
  borderRadius: '12px',
  border: 'none',
  backgroundColor: active ? '#008060' : '#c9cccf',
  cursor: 'pointer',
  position: 'relative' as const,
  transition: 'background-color 0.2s',
  padding: 0,
});

export const toggleKnobStyle = (active: boolean): React.CSSProperties => ({
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  backgroundColor: '#ffffff',
  position: 'absolute' as const,
  top: '2px',
  left: active ? '22px' : '2px',
  transition: 'left 0.2s',
  boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
});

export function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (val: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={() => onChange(!value)}
      style={toggleStyle(value)}
    >
      <div style={toggleKnobStyle(value)} />
    </button>
  );
}

export function NumberField({
  label,
  sublabel,
  value,
  onChange,
  step,
  min,
  prefix,
  suffix,
}: {
  label: string;
  sublabel?: string;
  value: number | undefined;
  onChange: (val: number) => void;
  step?: number;
  min?: number;
  prefix?: string;
  suffix?: string;
}) {
  const addonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 8px',
    fontSize: '13px',
    color: '#6d7175',
    backgroundColor: '#f6f6f7',
    borderTop: '1px solid #c9cccf',
    borderBottom: '1px solid #c9cccf',
    lineHeight: 1,
    whiteSpace: 'nowrap',
  };

  return (
    <div style={fieldRowStyle}>
      <div>
        <div style={labelStyle}>{label}</div>
        {sublabel && <div style={sublabelStyle}>{sublabel}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'stretch', width: '100px' }}>
        {prefix && (
          <span
            style={{
              ...addonStyle,
              borderLeft: '1px solid #c9cccf',
              borderRadius: '4px 0 0 4px',
            }}
          >
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          step={step ?? 0.01}
          min={min ?? 0}
          style={{
            ...numberInputStyle,
            width: undefined,
            flex: 1,
            minWidth: 0,
            borderRadius: prefix && suffix
              ? '0'
              : prefix
                ? '0 4px 4px 0'
                : suffix
                  ? '4px 0 0 4px'
                  : '4px',
            ...(prefix ? { borderLeft: 'none' } : {}),
            ...(suffix ? { borderRight: 'none' } : {}),
          }}
        />
        {suffix && (
          <span
            style={{
              ...addonStyle,
              borderRight: '1px solid #c9cccf',
              borderRadius: '0 4px 4px 0',
            }}
          >
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export function ToggleField({
  label,
  sublabel,
  value,
  onChange,
}: {
  label: string;
  sublabel?: string;
  value: boolean | undefined;
  onChange: (val: boolean) => void;
}) {
  return (
    <div style={fieldRowStyle}>
      <div>
        <div style={labelStyle}>{label}</div>
        {sublabel && <div style={sublabelStyle}>{sublabel}</div>}
      </div>
      <Toggle value={value ?? false} onChange={onChange} label={label} />
    </div>
  );
}
