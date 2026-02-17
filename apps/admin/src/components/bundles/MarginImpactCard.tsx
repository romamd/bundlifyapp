import React from 'react';

interface MarginImpactCardProps {
  bundlePrice: number;
  individualTotal: number;
  discountPct: number;
  contributionMargin: number;
  contributionMarginPct: number;
  isProfitable: boolean;
}

export function MarginImpactCard({
  bundlePrice,
  individualTotal,
  discountPct,
  contributionMargin,
  contributionMarginPct,
  isProfitable,
}: MarginImpactCardProps) {
  const savingsAmount = individualTotal - bundlePrice;

  const profitColor = isProfitable ? '#1a5632' : '#8c1a1a';
  const profitBg = isProfitable ? '#aee9d1' : '#ffd2d2';

  return (
    <div
      style={{
        border: '1px solid #e1e3e5',
        borderRadius: '8px',
        padding: '16px',
        backgroundColor: '#ffffff',
      }}
    >
      <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 12px 0' }}>
        Margin Impact
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '12px',
        }}
      >
        <div>
          <div style={{ fontSize: '12px', color: '#6d7175' }}>
            Individual Total
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600 }}>
            ${individualTotal.toFixed(2)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#6d7175' }}>Bundle Price</div>
          <div style={{ fontSize: '16px', fontWeight: 600 }}>
            ${bundlePrice.toFixed(2)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#6d7175' }}>
            Customer Savings
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#008060' }}>
            ${savingsAmount.toFixed(2)} ({discountPct.toFixed(0)}%)
          </div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#6d7175' }}>
            Contribution Margin
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: profitColor }}>
            ${contributionMargin.toFixed(2)} ({contributionMarginPct.toFixed(1)}
            %)
          </div>
        </div>
      </div>

      <div
        style={{
          padding: '8px 12px',
          borderRadius: '6px',
          backgroundColor: profitBg,
          color: profitColor,
          fontSize: '13px',
          fontWeight: 600,
          textAlign: 'center',
        }}
      >
        {isProfitable
          ? `This bundle is profitable with a ${contributionMarginPct.toFixed(1)}% margin`
          : `Warning: This bundle loses $${Math.abs(contributionMargin).toFixed(2)} per sale`}
      </div>
    </div>
  );
}
