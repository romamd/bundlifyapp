import React, { useMemo } from 'react';
import { calculateBundleMargin } from '@bundlify/margin-engine';

interface DiscountSliderItem {
  price: number;
  cogs: number;
  shippingCost: number;
  additionalCosts: number;
  quantity: number;
}

interface DiscountSliderProps {
  value: number;
  onChange: (discount: number) => void;
  items: DiscountSliderItem[];
  paymentProcessingPct: number;
  paymentProcessingFlat: number;
}

export function DiscountSlider({
  value,
  onChange,
  items,
  paymentProcessingPct,
  paymentProcessingFlat,
}: DiscountSliderProps) {
  const margin = useMemo(() => {
    if (items.length === 0) return null;
    return calculateBundleMargin({
      items,
      bundleDiscountPct: value,
      paymentProcessingPct,
      paymentProcessingFlat,
    });
  }, [value, items, paymentProcessingPct, paymentProcessingFlat]);

  const marginColor =
    margin === null
      ? '#6d7175'
      : margin.isProfitable
        ? margin.contributionMarginPct >= 30
          ? '#1a5632'
          : margin.contributionMarginPct >= 15
            ? '#6a5c00'
            : '#b98900'
        : '#8c1a1a';

  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: '#f6f6f7',
        borderRadius: '8px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <label style={{ fontWeight: 600, fontSize: '14px' }}>
          Discount: {value}%
        </label>
        {margin && (
          <span style={{ fontSize: '14px', fontWeight: 600, color: marginColor }}>
            {margin.isProfitable ? 'Profitable' : 'Unprofitable'} - Margin:{' '}
            {margin.contributionMarginPct.toFixed(1)}%
          </span>
        )}
      </div>

      <input
        type="range"
        min={0}
        max={50}
        step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        style={{ width: '100%', cursor: 'pointer' }}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#6d7175',
          marginTop: '4px',
        }}
      >
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
      </div>

      {margin && (
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginTop: '12px',
            fontSize: '13px',
          }}
        >
          <div>
            <span style={{ color: '#6d7175' }}>Bundle Price: </span>
            <strong>${margin.effectivePrice.toFixed(2)}</strong>
          </div>
          <div>
            <span style={{ color: '#6d7175' }}>Margin: </span>
            <strong style={{ color: marginColor }}>
              ${margin.contributionMargin.toFixed(2)}
            </strong>
          </div>
          <div>
            <span style={{ color: '#6d7175' }}>Processing: </span>
            <span>${margin.processingFee.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
