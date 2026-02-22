import React from 'react';
import type { ShopSettingsDto } from '@bundlify/shared-types';

interface WidgetPreviewProps {
  settings: Partial<ShopSettingsDto>;
}

const MOCK_PRODUCTS = [
  { name: 'Hydrating Face Serum', variant: '30ml', price: 34.99, compareAt: 39.99, image: null },
  { name: 'Vitamin C Moisturizer', variant: '50ml', price: 28.99, compareAt: 32.99, image: null },
  { name: 'SPF 50 Daily Sunscreen', variant: '40ml', price: 25.99, compareAt: 29.99, image: null },
];

const TOTAL = MOCK_PRODUCTS.reduce((s, p) => s + p.price, 0);
const COMPARE_TOTAL = MOCK_PRODUCTS.reduce((s, p) => s + p.compareAt, 0);
const DISCOUNT_PCT = 15;
const BUNDLE_PRICE = +(TOTAL * (1 - DISCOUNT_PCT / 100)).toFixed(2);
const SAVINGS = +(TOTAL - BUNDLE_PRICE).toFixed(2);

function shadowValue(shadow: string | undefined): string {
  switch (shadow) {
    case 'none': return 'none';
    case 'medium': return '0 4px 12px rgba(0,0,0,0.12)';
    case 'strong': return '0 8px 24px rgba(0,0,0,0.18)';
    default: return '0 1px 4px rgba(0,0,0,0.06)';
  }
}

export function WidgetPreview({ settings }: WidgetPreviewProps) {
  const s = settings;

  const cssVars: Record<string, string> = {
    '--bundlify-accent': s.widgetPrimaryColor ?? '#008060',
    '--bundlify-accent-hover': s.widgetPrimaryColorHover ?? '#006e52',
    '--bundlify-card-bg': s.widgetCardBackground ?? '#ffffff',
    '--bundlify-selected-bg': s.widgetSelectedBgColor ?? '#f1f8f5',
    '--bundlify-border': s.widgetBorderColor ?? '#e1e3e5',
    '--bundlify-block-title': s.widgetBlockTitleColor ?? '#202223',
    '--bundlify-title': s.widgetTitleColor ?? '#202223',
    '--bundlify-subtitle': s.widgetSubtitleColor ?? '#6d7175',
    '--bundlify-price': s.widgetPriceColor ?? '#202223',
    '--bundlify-original-price': s.widgetOriginalPriceColor ?? '#6d7175',
    '--bundlify-btn-text': s.widgetButtonTextColor ?? '#ffffff',
    '--bundlify-badge-bg': s.widgetBadgeBackground ?? '#f1f8f5',
    '--bundlify-badge-text': s.widgetBadgeTextColor ?? '#008060',
    '--bundlify-savings-badge-bg': s.widgetSavingsBadgeBgColor ?? '#dcfce7',
    '--bundlify-savings-badge-text': s.widgetSavingsBadgeTextColor ?? '#166534',
    '--bundlify-label-bg': s.widgetLabelBgColor ?? '#f3f4f6',
    '--bundlify-label-text': s.widgetLabelTextColor ?? '#374151',
    '--bundlify-card-hover-bg': s.widgetCardHoverBgColor ?? '#f9fafb',
    '--bundlify-text': s.widgetTextColor ?? '#202223',
    '--bundlify-secondary-text': s.widgetSecondaryTextColor ?? '#6d7175',
    '--bundlify-gift-bg': s.widgetGiftBgColor ?? '#fffbeb',
    '--bundlify-gift-text': s.widgetGiftTextColor ?? '#92400e',
    '--bundlify-gift-selected-bg': s.widgetGiftSelectedBgColor ?? '#fef3c7',
    '--bundlify-gift-selected-text': s.widgetGiftSelectedTextColor ?? '#78350f',
    '--bundlify-upsell-bg': s.widgetUpsellBgColor ?? '#eff6ff',
    '--bundlify-upsell-text': s.widgetUpsellTextColor ?? '#1e40af',
    '--bundlify-upsell-selected-bg': s.widgetUpsellSelectedBgColor ?? '#dbeafe',
    '--bundlify-upsell-selected-text': s.widgetUpsellSelectedTextColor ?? '#1e3a8a',
    '--bundlify-radius': `${s.widgetBorderRadius ?? 10}px`,
    '--bundlify-spacing': `${s.widgetSpacing ?? 12}px`,
    '--bundlify-font-size': `${s.widgetFontSize ?? 14}px`,
    '--bundlify-font-weight': s.widgetFontWeight ?? 'normal',
    '--bundlify-shadow': shadowValue(s.widgetCardShadow),
  };

  const radius = s.widgetBorderRadius ?? 10;
  const spacing = s.widgetSpacing ?? 12;
  const showSavings = s.widgetShowSavings !== false;
  const showCompareAt = s.widgetShowCompareAtPrice !== false;
  const buttonText = s.widgetButtonText || 'Add Bundle to Cart';
  const layout = (s.widgetLayout as string) || 'vertical';

  const blockTitleFs = s.widgetBlockTitleFontSize ?? 18;
  const blockTitleFw = s.widgetBlockTitleFontWeight ?? 'bold';
  const itemTitleFs = s.widgetItemTitleFontSize ?? 14;
  const itemTitleFw = s.widgetItemTitleFontWeight ?? 'normal';
  const subtitleFs = s.widgetSubtitleFontSize ?? 13;
  const subtitleFw = s.widgetSubtitleFontWeight ?? 'normal';
  const priceFs = s.widgetPriceFontSize ?? 16;
  const priceFw = s.widgetPriceFontWeight ?? 'bold';
  const badgeFs = s.widgetBadgeFontSize ?? 12;
  const badgeFw = s.widgetBadgeFontWeight ?? 'bold';
  const buttonFs = s.widgetButtonFontSize ?? 14;
  const buttonFw = s.widgetButtonFontWeight ?? 'bold';

  return (
    <div id="bundlify-preview" style={{ ...cssVars as any }}>
      {/* Custom CSS injection */}
      {s.widgetCustomCss && (
        <style>{s.widgetCustomCss}</style>
      )}

      <div
        className="bundlify-card"
        style={{
          border: `1px solid var(--bundlify-border)`,
          borderRadius: `${radius}px`,
          backgroundColor: 'var(--bundlify-card-bg)',
          boxShadow: 'var(--bundlify-shadow)',
          overflow: 'hidden',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: 'var(--bundlify-font-size)',
          fontWeight: 'var(--bundlify-font-weight)' as any,
          color: 'var(--bundlify-text)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: `${spacing}px ${spacing + 4}px`,
          borderBottom: '1px solid var(--bundlify-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{
            fontSize: `${blockTitleFs}px`,
            fontWeight: blockTitleFw as any,
            color: 'var(--bundlify-block-title)',
          }}>
            Complete Skincare Kit
          </span>
          {showSavings && (
            <span style={{
              fontSize: `${badgeFs}px`,
              fontWeight: badgeFw as any,
              backgroundColor: 'var(--bundlify-savings-badge-bg)',
              color: 'var(--bundlify-savings-badge-text)',
              padding: '2px 8px',
              borderRadius: '99px',
            }}>
              Save {DISCOUNT_PCT}%
            </span>
          )}
        </div>

        {/* Products */}
        <div style={{
          padding: `${spacing}px ${spacing + 4}px`,
          ...(layout === 'grid'
            ? { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: `${spacing}px` }
            : { display: 'flex', flexDirection: layout === 'horizontal' ? 'row' as const : 'column' as const, gap: layout === 'compact' ? `${Math.max(spacing - 6, 4)}px` : `${spacing}px` }),
          ...(layout === 'horizontal' ? { overflowX: 'auto' as const } : {}),
        }}>
          {MOCK_PRODUCTS.map((product, i) => {
            const isCompact = layout === 'compact';
            const imgSize = isCompact ? 32 : 48;
            return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isCompact ? `${Math.max(spacing - 4, 4)}px` : `${spacing}px`,
                padding: isCompact ? `${Math.max(spacing - 8, 2)}px` : `${spacing - 4}px`,
                borderRadius: `${Math.max(radius - 2, 0)}px`,
                backgroundColor: i === 0 ? 'var(--bundlify-selected-bg)' : 'transparent',
                border: i === 0 ? '1px solid var(--bundlify-accent)' : '1px solid transparent',
                ...(layout === 'horizontal' ? { minWidth: '160px', flexShrink: 0, flexDirection: 'column' as const, textAlign: 'center' as const } : {}),
                ...(layout === 'grid' ? { flexDirection: 'column' as const, textAlign: 'center' as const } : {}),
              }}
            >
              {/* Placeholder image */}
              <div style={{
                width: `${imgSize}px`,
                height: `${imgSize}px`,
                borderRadius: `${Math.max(radius - 4, 0)}px`,
                backgroundColor: '#f3f4f6',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isCompact ? '14px' : '20px',
                color: '#9ca3af',
              }}>
                {'\u{1F9F4}'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: `${itemTitleFs}px`,
                  fontWeight: itemTitleFw as any,
                  color: 'var(--bundlify-title)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {product.name}
                </div>
                <div style={{
                  fontSize: `${subtitleFs}px`,
                  fontWeight: subtitleFw as any,
                  color: 'var(--bundlify-subtitle)',
                }}>
                  {product.variant}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{
                  fontSize: `${priceFs}px`,
                  fontWeight: priceFw as any,
                  color: 'var(--bundlify-price)',
                }}>
                  ${product.price.toFixed(2)}
                </div>
                {showCompareAt && (
                  <div style={{
                    fontSize: `${subtitleFs - 1}px`,
                    color: 'var(--bundlify-original-price)',
                    textDecoration: 'line-through',
                  }}>
                    ${product.compareAt.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: `${spacing}px ${spacing + 4}px`,
          borderTop: '1px solid var(--bundlify-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{
              fontSize: `${priceFs + 2}px`,
              fontWeight: priceFw as any,
              color: 'var(--bundlify-price)',
            }}>
              ${BUNDLE_PRICE.toFixed(2)}
            </div>
            {showCompareAt && (
              <div style={{
                fontSize: `${subtitleFs}px`,
                color: 'var(--bundlify-original-price)',
                textDecoration: 'line-through',
              }}>
                ${TOTAL.toFixed(2)}
              </div>
            )}
            {showSavings && (
              <div style={{
                fontSize: `${badgeFs}px`,
                fontWeight: badgeFw as any,
                color: 'var(--bundlify-savings-badge-text)',
                marginTop: '2px',
              }}>
                You save ${SAVINGS.toFixed(2)}
              </div>
            )}
          </div>
          <button style={{
            padding: '10px 20px',
            backgroundColor: 'var(--bundlify-accent)',
            color: 'var(--bundlify-btn-text)',
            border: 'none',
            borderRadius: `${radius}px`,
            fontSize: `${buttonFs}px`,
            fontWeight: buttonFw as any,
            cursor: 'pointer',
          }}>
            {buttonText}
          </button>
        </div>
      </div>

      {/* Sticky bar preview */}
      {s.stickyBarEnabled && (
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          backgroundColor: s.stickyBarBgColor ?? '#ffffff',
          color: s.stickyBarTextColor ?? '#111827',
          borderRadius: `${radius}px`,
          border: '1px solid var(--bundlify-border)',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{
              fontSize: `${s.stickyBarTitleFontSize ?? 14}px`,
              fontWeight: (s.stickyBarTitleFontWeight ?? 'normal') as any,
            }}>
              Complete Skincare Kit — ${BUNDLE_PRICE.toFixed(2)}
            </div>
          </div>
          <button style={{
            padding: `${s.stickyBarButtonPadding ?? 15}px ${(s.stickyBarButtonPadding ?? 15) + 10}px`,
            backgroundColor: s.stickyBarButtonBgColor ?? '#2563eb',
            color: s.stickyBarButtonTextColor ?? '#ffffff',
            border: 'none',
            borderRadius: `${s.stickyBarButtonBorderRadius ?? 8}px`,
            fontSize: `${s.stickyBarButtonFontSize ?? 14}px`,
            fontWeight: (s.stickyBarButtonFontWeight ?? 'bold') as any,
            cursor: 'pointer',
          }}>
            {s.stickyBarButtonText || 'Choose Bundle'}
          </button>
        </div>
      )}
    </div>
  );
}
