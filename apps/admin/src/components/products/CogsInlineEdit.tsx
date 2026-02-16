import React, { useState } from 'react';
import type { ProductDto } from '@bundlify/shared-types';
import { calculateProductMargin } from '@bundlify/margin-engine';

interface CogsInlineEditProps {
  product: ProductDto;
  onSave: (data: {
    cogs?: number;
    shippingCost?: number;
    additionalCosts?: number;
  }) => Promise<void>;
  onCancel: () => void;
}

export function CogsInlineEdit({
  product,
  onSave,
  onCancel,
}: CogsInlineEditProps) {
  const [cogs, setCogs] = useState(product.cogs?.toString() ?? '');
  const [shippingCost, setShippingCost] = useState(
    product.shippingCost?.toString() ?? '',
  );
  const [additionalCosts, setAdditionalCosts] = useState(
    product.additionalCosts?.toString() ?? '',
  );
  const [saving, setSaving] = useState(false);

  const preview = cogs
    ? calculateProductMargin({
        price: product.price,
        cogs: parseFloat(cogs) || 0,
        shippingCost: parseFloat(shippingCost) || 0,
        additionalCosts: parseFloat(additionalCosts) || 0,
        paymentProcessingPct: 2.9,
        paymentProcessingFlat: 0.3,
      })
    : null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        ...(cogs && { cogs: parseFloat(cogs) }),
        ...(shippingCost && { shippingCost: parseFloat(shippingCost) }),
        ...(additionalCosts && {
          additionalCosts: parseFloat(additionalCosts),
        }),
      });
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: '6px 8px',
    border: '1px solid #c9cccf',
    borderRadius: '4px',
    width: '100px',
    fontSize: '14px',
  };

  return (
    <div style={{ padding: '12px', backgroundColor: '#f6f6f7', borderRadius: '8px' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <label>
          COGS ($)
          <br />
          <input
            type="number"
            min="0"
            step="0.01"
            value={cogs}
            onChange={(e) => setCogs(e.target.value)}
            style={inputStyle}
          />
        </label>
        <label>
          Shipping ($)
          <br />
          <input
            type="number"
            min="0"
            step="0.01"
            value={shippingCost}
            onChange={(e) => setShippingCost(e.target.value)}
            style={inputStyle}
          />
        </label>
        <label>
          Additional ($)
          <br />
          <input
            type="number"
            min="0"
            step="0.01"
            value={additionalCosts}
            onChange={(e) => setAdditionalCosts(e.target.value)}
            style={inputStyle}
          />
        </label>

        {preview && (
          <div style={{ marginLeft: '12px', fontSize: '14px' }}>
            Margin:{' '}
            <strong
              style={{
                color: preview.isProfitable ? '#1a5632' : '#8c1a1a',
              }}
            >
              ${preview.contributionMargin.toFixed(2)} (
              {preview.contributionMarginPct.toFixed(1)}%)
            </strong>
          </div>
        )}
      </div>

      <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
        <button
          onClick={handleSave}
          disabled={saving || !cogs}
          style={{
            padding: '6px 16px',
            backgroundColor: '#008060',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: '6px 16px',
            backgroundColor: 'white',
            border: '1px solid #c9cccf',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
