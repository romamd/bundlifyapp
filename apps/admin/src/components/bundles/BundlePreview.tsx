import React from 'react';

interface BundlePreviewProps {
  bundleType: string;
  name: string;
  items: Array<{
    productId: string;
    title: string;
    price: number;
    imageUrl?: string | null;
    quantity: number;
  }>;
  discountPct: number;
  volumeTiers?: Array<{
    minQuantity: number;
    discountPct: number;
    label?: string;
  }>;
  bogoGetQuantity?: number;
  bogoGetDiscountPct?: number;
}

export function BundlePreview({
  bundleType,
  name,
  items,
  discountPct,
  volumeTiers,
  bogoGetQuantity,
  bogoGetDiscountPct,
}: BundlePreviewProps) {
  const individualTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const bundlePrice = individualTotal * (1 - discountPct / 100);
  const saved = individualTotal - bundlePrice;

  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '16px',
        background: '#fafafa',
      }}
    >
      <div
        style={{
          fontSize: '12px',
          color: '#6b7280',
          fontWeight: 600,
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Preview
      </div>

      <div
        style={{
          background: '#fff',
          borderRadius: '10px',
          border: '1px solid #e5e7eb',
          padding: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
      >
        {name && (
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600 }}>
            {name}
          </h3>
        )}

        {items.length > 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginBottom: '12px',
            }}
          >
            {items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                }}
              >
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt=""
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 6,
                      objectFit: 'cover',
                    }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>
                    {item.title || 'Product'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    Qty: {item.quantity}
                  </div>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: '13px',
            }}
          >
            Select products to see preview
          </div>
        )}

        {bundleType === 'VOLUME' && volumeTiers && volumeTiers.length > 0 ? (
          <div
            style={{
              borderTop: '1px solid #e5e7eb',
              paddingTop: '12px',
              marginTop: '8px',
            }}
          >
            {volumeTiers.map((tier, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  fontSize: '13px',
                  background:
                    idx === volumeTiers.length - 1 ? '#eff6ff' : 'transparent',
                  borderRadius: '6px',
                  marginBottom: '4px',
                }}
              >
                <span>
                  Buy {tier.minQuantity}+
                  {tier.label ? ` \u2014 ${tier.label}` : ''}
                </span>
                <span style={{ fontWeight: 600, color: '#2563eb' }}>
                  {tier.discountPct}% off
                </span>
              </div>
            ))}
          </div>
        ) : bundleType === 'BOGO' ? (
          <div
            style={{
              borderTop: '1px solid #e5e7eb',
              paddingTop: '12px',
              marginTop: '8px',
              textAlign: 'center',
            }}
          >
            <span
              style={{
                background: '#dcfce7',
                color: '#166534',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              GET {bogoGetQuantity || 1}{' '}
              {(bogoGetDiscountPct ?? 100) >= 100
                ? 'FREE'
                : `at ${bogoGetDiscountPct}% off`}
            </span>
          </div>
        ) : items.length > 0 ? (
          <div
            style={{
              borderTop: '1px solid #e5e7eb',
              paddingTop: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  textDecoration: 'line-through',
                }}
              >
                ${individualTotal.toFixed(2)}
              </div>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#111827',
                }}
              >
                ${bundlePrice.toFixed(2)}
              </div>
            </div>
            {saved > 0 && (
              <span
                style={{
                  background: '#dcfce7',
                  color: '#166534',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                SAVE ${saved.toFixed(2)}
              </span>
            )}
          </div>
        ) : null}

        <button
          style={{
            width: '100%',
            marginTop: '12px',
            padding: '10px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'default',
          }}
        >
          Add Bundle to Cart
        </button>
      </div>
    </div>
  );
}
