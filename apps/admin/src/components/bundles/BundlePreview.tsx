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
  countdownEnabled?: boolean;
  countdownTitle?: string;
  countdownBgColor?: string;
  countdownTextColor?: string;
  countdownTitleFontSize?: number;
  countdownTitleFontWeight?: string;
  countdownTitleAlignment?: string;
  upsells?: Array<{
    title: string;
    subtitle?: string;
    selectedByDefault?: boolean;
    discountType?: string;
    discountValue?: number;
  }>;
  giftsEnabled?: boolean;
  giftsTitle?: string;
  giftTiers?: Array<{
    label: string;
    unlockQuantity: number;
    giftType: string;
    lockedTitle?: string;
  }>;
  lowStockAlertEnabled?: boolean;
  skipToCheckout?: boolean;
  customCss?: string;
  accentColor?: string;
  cardBg?: string;
  textColor?: string;
  borderColor?: string;
}

export function BundlePreview({
  bundleType,
  name,
  items,
  discountPct,
  volumeTiers,
  bogoGetQuantity,
  bogoGetDiscountPct,
  countdownEnabled,
  countdownTitle,
  countdownBgColor,
  countdownTextColor,
  countdownTitleFontSize,
  countdownTitleFontWeight,
  countdownTitleAlignment,
  upsells,
  giftsEnabled,
  giftsTitle,
  giftTiers,
  lowStockAlertEnabled,
  skipToCheckout,
  customCss,
  accentColor,
  cardBg,
  textColor,
  borderColor,
}: BundlePreviewProps) {
  const accent = accentColor || '#2563eb';
  const bg = cardBg || '#fff';
  const text = textColor || '#111827';
  const border = borderColor || '#e5e7eb';
  const individualTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const bundlePrice = individualTotal * (1 - discountPct / 100);
  const saved = individualTotal - bundlePrice;

  const timerDisplay = '14:59';
  const countdownText = countdownTitle
    ? countdownTitle.replace('{{timer}}', timerDisplay)
    : `Hurry! Offer expires in ${timerDisplay}`;

  return (
    <div
      className="bundlify-bundle-preview"
      style={{
        border: `1px solid ${border}`,
        borderRadius: '12px',
        padding: '16px',
        background: '#fafafa',
      }}
    >
      {customCss && <style>{customCss}</style>}

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

      {/* Countdown bar */}
      {countdownEnabled && (
        <div
          style={{
            background: countdownBgColor || '#111827',
            color: countdownTextColor || '#ffffff',
            padding: '8px 12px',
            borderRadius: '10px 10px 0 0',
            fontSize: `${countdownTitleFontSize ?? 14}px`,
            fontWeight: (countdownTitleFontWeight ?? 'normal') as any,
            textAlign: (countdownTitleAlignment ?? 'center') as any,
          }}
        >
          {countdownText}
        </div>
      )}

      <div
        style={{
          background: bg,
          borderRadius: countdownEnabled ? '0 0 10px 10px' : '10px',
          border: `1px solid ${border}`,
          borderTop: countdownEnabled ? 'none' : '1px solid #e5e7eb',
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
                  position: 'relative',
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
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                  {lowStockAlertEnabled && idx === 0 && (
                    <span style={{
                      fontSize: '11px',
                      color: '#dc2626',
                      fontWeight: 600,
                    }}>
                      Only 3 left!
                    </span>
                  )}
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

        {/* Upsells */}
        {upsells && upsells.length > 0 && (
          <div style={{
            borderTop: `1px solid ${border}`,
            paddingTop: '10px',
            marginTop: '4px',
            marginBottom: '8px',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Add-ons
            </div>
            {upsells.map((upsell, idx) => (
              <label
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 8px',
                  background: upsell.selectedByDefault ? '#eff6ff' : '#f9fafb',
                  borderRadius: '6px',
                  marginBottom: '4px',
                  cursor: 'default',
                  fontSize: '13px',
                }}
              >
                <input
                  type="checkbox"
                  checked={upsell.selectedByDefault ?? false}
                  readOnly
                  style={{ accentColor: '#2563eb' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{upsell.title}</div>
                  {upsell.subtitle && (
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>{upsell.subtitle}</div>
                  )}
                </div>
                {upsell.discountValue != null && upsell.discountValue > 0 && (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#166534',
                    background: '#dcfce7',
                    padding: '2px 6px',
                    borderRadius: '8px',
                  }}>
                    {upsell.discountType === 'FIXED'
                      ? `-$${upsell.discountValue.toFixed(2)}`
                      : `-${upsell.discountValue}%`}
                  </span>
                )}
              </label>
            ))}
          </div>
        )}

        {/* Gifts */}
        {giftsEnabled && giftTiers && giftTiers.length > 0 && (
          <div style={{
            borderTop: `1px solid ${border}`,
            paddingTop: '10px',
            marginTop: '4px',
            marginBottom: '8px',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#92400e', marginBottom: '6px' }}>
              {giftsTitle || 'Free gifts with your order'}
            </div>
            {giftTiers.map((tier, idx) => {
              const totalQty = items.reduce((s, i) => s + i.quantity, 0);
              const unlocked = totalQty >= tier.unlockQuantity;
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px',
                    background: unlocked ? '#fef3c7' : '#f9fafb',
                    borderRadius: '6px',
                    marginBottom: '4px',
                    fontSize: '13px',
                    opacity: unlocked ? 1 : 0.6,
                  }}
                >
                  <span style={{ fontSize: '14px' }}>{unlocked ? '\uD83C\uDF81' : '\uD83D\uDD12'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>
                      {unlocked ? tier.label : (tier.lockedTitle || 'Locked')}
                    </div>
                    {!unlocked && (
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>
                        Add {tier.unlockQuantity - totalQty} more to unlock
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {bundleType === 'VOLUME' && volumeTiers && volumeTiers.length > 0 ? (
          <div
            style={{
              borderTop: `1px solid ${border}`,
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
                <span style={{ fontWeight: 600, color: accent }}>
                  {tier.discountPct}% off
                </span>
              </div>
            ))}
          </div>
        ) : bundleType === 'BOGO' ? (
          <div
            style={{
              borderTop: `1px solid ${border}`,
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
              borderTop: `1px solid ${border}`,
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
                  color: text,
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
            background: accent,
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'default',
          }}
        >
          {skipToCheckout ? 'Buy Now' : 'Add Bundle to Cart'}
        </button>
      </div>
    </div>
  );
}
