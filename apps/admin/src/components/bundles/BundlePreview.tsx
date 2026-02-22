import React from 'react';

export interface BundlePreviewTheme {
  primaryColor?: string;
  primaryColorHover?: string;
  textColor?: string;
  cardBackground?: string;
  borderColor?: string;
  badgeBackground?: string;
  badgeTextColor?: string;
  selectedBgColor?: string;
  blockTitleColor?: string;
  titleColor?: string;
  subtitleColor?: string;
  priceColor?: string;
  originalPriceColor?: string;
  labelBgColor?: string;
  labelTextColor?: string;
  buttonTextColor?: string;
  savingsBadgeBgColor?: string;
  savingsBadgeTextColor?: string;
  giftBgColor?: string;
  giftTextColor?: string;
  upsellBgColor?: string;
  upsellTextColor?: string;
  fontSize?: number;
  fontWeight?: string;
  blockTitleFontSize?: number;
  blockTitleFontWeight?: string;
  itemTitleFontSize?: number;
  itemTitleFontWeight?: string;
  priceFontSize?: number;
  priceFontWeight?: string;
  badgeFontSize?: number;
  badgeFontWeight?: string;
  buttonFontSize?: number;
  buttonFontWeight?: string;
  giftFontSize?: number;
  giftFontWeight?: string;
  upsellFontSize?: number;
  upsellFontWeight?: string;
  layout?: string;
  spacing?: number;
  borderRadius?: number;
  cardShadow?: string;
  buttonText?: string;
  showSavings?: boolean;
  showCompareAtPrice?: boolean;
}

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
  theme?: BundlePreviewTheme;
}

const SHADOW_MAP: Record<string, string> = {
  none: 'none',
  subtle: '0 1px 3px rgba(0,0,0,0.08)',
  medium: '0 4px 6px rgba(0,0,0,0.1)',
  bold: '0 10px 15px rgba(0,0,0,0.15)',
};

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
  theme,
}: BundlePreviewProps) {
  const t = theme ?? {};
  const accent = t.primaryColor || '#2563eb';
  const bg = t.cardBackground || '#fff';
  const text = t.titleColor || t.textColor || '#111827';
  const border = t.borderColor || '#e5e7eb';
  const subtitleColor = t.subtitleColor || '#6b7280';
  const priceColor = t.priceColor || text;
  const originalPriceColor = t.originalPriceColor || '#9ca3af';
  const badgeBg = t.savingsBadgeBgColor || t.badgeBackground || '#dcfce7';
  const badgeText = t.savingsBadgeTextColor || t.badgeTextColor || '#166534';
  const btnText = t.buttonTextColor || '#fff';
  const btnLabel = t.buttonText || (skipToCheckout ? 'Buy Now' : 'Add Bundle to Cart');
  const radius = t.borderRadius ?? 10;
  const shadow = SHADOW_MAP[t.cardShadow || 'subtle'] || SHADOW_MAP.subtle;
  const spacing = t.spacing ?? 8;
  const blockTitleSize = t.blockTitleFontSize ?? 16;
  const blockTitleWeight = t.blockTitleFontWeight || '600';
  const blockTitleColor = t.blockTitleColor || text;
  const itemTitleSize = t.itemTitleFontSize ?? 14;
  const itemTitleWeight = t.itemTitleFontWeight || '500';
  const priceFontSize = t.priceFontSize ?? 14;
  const priceFontWeight = t.priceFontWeight || '500';
  const badgeFontSize = t.badgeFontSize ?? 12;
  const badgeFontWeight = t.badgeFontWeight || '600';
  const btnFontSize = t.buttonFontSize ?? 14;
  const btnFontWeight = t.buttonFontWeight || '600';
  const giftBg = t.giftBgColor || '#fef3c7';
  const giftText = t.giftTextColor || '#92400e';
  const giftFontSize = t.giftFontSize ?? 13;
  const giftFontWeight = t.giftFontWeight || '500';
  const upsellBg = t.upsellBgColor || '#f9fafb';
  const upsellText = t.upsellTextColor || '#111827';
  const upsellFontSize = t.upsellFontSize ?? 13;
  const upsellFontWeight = t.upsellFontWeight || '500';
  const selectedBg = t.selectedBgColor || '#eff6ff';
  const showSavings = t.showSavings !== false;

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
        borderRadius: `${radius + 2}px`,
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
            borderRadius: `${radius}px ${radius}px 0 0`,
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
          borderRadius: countdownEnabled ? `0 0 ${radius}px ${radius}px` : `${radius}px`,
          border: `1px solid ${border}`,
          borderTop: countdownEnabled ? 'none' : `1px solid ${border}`,
          padding: '16px',
          boxShadow: shadow,
        }}
      >
        {name && (
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: `${blockTitleSize}px`,
            fontWeight: blockTitleWeight as any,
            color: blockTitleColor,
          }}>
            {name}
          </h3>
        )}

        {items.length > 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: `${spacing}px`,
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
                  borderRadius: `${Math.max(radius - 2, 4)}px`,
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
                      borderRadius: Math.max(radius - 4, 4),
                      objectFit: 'cover',
                    }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: `${itemTitleSize}px`, fontWeight: itemTitleWeight as any, color: text }}>
                    {item.title || 'Product'}
                  </div>
                  <div style={{ fontSize: '12px', color: subtitleColor }}>
                    Qty: {item.quantity}
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                  <div style={{ fontSize: `${priceFontSize}px`, fontWeight: priceFontWeight as any, color: priceColor }}>
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
            <div style={{ fontSize: '12px', fontWeight: 600, color: subtitleColor, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
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
                  background: upsell.selectedByDefault ? selectedBg : upsellBg,
                  borderRadius: `${Math.max(radius - 4, 4)}px`,
                  marginBottom: '4px',
                  cursor: 'default',
                  fontSize: `${upsellFontSize}px`,
                  color: upsellText,
                }}
              >
                <input
                  type="checkbox"
                  checked={upsell.selectedByDefault ?? false}
                  readOnly
                  style={{ accentColor: accent }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: upsellFontWeight as any }}>{upsell.title}</div>
                  {upsell.subtitle && (
                    <div style={{ fontSize: '11px', color: subtitleColor }}>{upsell.subtitle}</div>
                  )}
                </div>
                {upsell.discountValue != null && upsell.discountValue > 0 && (
                  <span style={{
                    fontSize: `${badgeFontSize}px`,
                    fontWeight: badgeFontWeight as any,
                    color: badgeText,
                    background: badgeBg,
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
            <div style={{ fontSize: `${giftFontSize}px`, fontWeight: 600, color: giftText, marginBottom: '6px' }}>
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
                    background: unlocked ? giftBg : '#f9fafb',
                    borderRadius: `${Math.max(radius - 4, 4)}px`,
                    marginBottom: '4px',
                    fontSize: `${giftFontSize}px`,
                    fontWeight: giftFontWeight as any,
                    color: giftText,
                    opacity: unlocked ? 1 : 0.6,
                  }}
                >
                  <span style={{ fontSize: '14px' }}>{unlocked ? '\uD83C\uDF81' : '\uD83D\uDD12'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>
                      {unlocked ? tier.label : (tier.lockedTitle || 'Locked')}
                    </div>
                    {!unlocked && (
                      <div style={{ fontSize: '11px', color: subtitleColor }}>
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
                  fontSize: `${priceFontSize}px`,
                  background:
                    idx === volumeTiers.length - 1 ? selectedBg : 'transparent',
                  borderRadius: `${Math.max(radius - 4, 4)}px`,
                  marginBottom: '4px',
                }}
              >
                <span style={{ color: text }}>
                  Buy {tier.minQuantity}+
                  {tier.label ? ` \u2014 ${tier.label}` : ''}
                </span>
                <span style={{ fontWeight: priceFontWeight as any, color: accent }}>
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
                background: badgeBg,
                color: badgeText,
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: `${badgeFontSize}px`,
                fontWeight: badgeFontWeight as any,
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
                  color: originalPriceColor,
                  textDecoration: 'line-through',
                }}
              >
                ${individualTotal.toFixed(2)}
              </div>
              <div
                style={{
                  fontSize: `${(t.priceFontSize ?? 16) + 4}px`,
                  fontWeight: 700,
                  color: priceColor,
                }}
              >
                ${bundlePrice.toFixed(2)}
              </div>
            </div>
            {showSavings && saved > 0 && (
              <span
                style={{
                  background: badgeBg,
                  color: badgeText,
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: `${badgeFontSize}px`,
                  fontWeight: badgeFontWeight as any,
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
            color: btnText,
            border: 'none',
            borderRadius: `${Math.max(radius - 2, 4)}px`,
            fontWeight: btnFontWeight as any,
            fontSize: `${btnFontSize}px`,
            cursor: 'default',
          }}
        >
          {btnLabel}
        </button>
      </div>
    </div>
  );
}
