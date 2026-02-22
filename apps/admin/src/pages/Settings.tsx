import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '../stores/settings.store';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';
import { LoadingState } from '../components/common/LoadingState';
import type { ShopSettingsDto } from '@bundlify/shared-types';

export function Settings() {
  const fetch = useAuthenticatedFetch();
  const { settings, loading, saving, error, fetchSettings, updateSettings } =
    useSettingsStore();

  const [form, setForm] = useState<Partial<ShopSettingsDto>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings(fetch);
  }, []);

  useEffect(() => {
    if (settings) {
      setForm({ ...settings });
    }
  }, [settings]);

  const updateField = <K extends keyof ShopSettingsDto>(
    key: K,
    value: ShopSettingsDto[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaved(false);
    await updateSettings(fetch, form);
    setSaved(true);
  };

  const sectionStyle: React.CSSProperties = {
    border: '1px solid #e1e3e5',
    borderRadius: '8px',
    padding: '20px',
    backgroundColor: '#ffffff',
    marginBottom: '16px',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    marginTop: 0,
    marginBottom: '16px',
  };

  const fieldRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid #f1f1f1',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#202223',
  };

  const sublabelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#6d7175',
    marginTop: '2px',
  };

  const numberInputStyle: React.CSSProperties = {
    padding: '6px 10px',
    border: '1px solid #c9cccf',
    borderRadius: '4px',
    fontSize: '14px',
    width: '120px',
    textAlign: 'right' as const,
  };

  const toggleStyle = (active: boolean): React.CSSProperties => ({
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

  const toggleKnobStyle = (active: boolean): React.CSSProperties => ({
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

  function Toggle({
    value,
    onChange,
  }: {
    value: boolean;
    onChange: (val: boolean) => void;
  }) {
    return (
      <button
        type="button"
        onClick={() => onChange(!value)}
        style={toggleStyle(value)}
      >
        <div style={toggleKnobStyle(value)} />
      </button>
    );
  }

  function NumberField({
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

  function ToggleField({
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
        <Toggle value={value ?? false} onChange={onChange} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h1 style={{ fontSize: '24px', margin: 0 }}>Settings</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {saved && (
            <span style={{ fontSize: '13px', color: '#1a5632', fontWeight: 500 }}>
              Settings saved
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || loading}
            style={{
              padding: '8px 20px',
              backgroundColor:
                saving || loading ? '#e4e5e7' : '#008060',
              color: saving || loading ? '#6d7175' : '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor:
                saving || loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            color: '#8c1a1a',
            padding: '12px',
            marginBottom: '12px',
            backgroundColor: '#ffd2d2',
            borderRadius: '8px',
          }}
        >
          Error: {error}
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : !settings ? (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            color: '#6d7175',
          }}
        >
          Unable to load settings.
        </div>
      ) : (
        <>
          {/* Section 1: Cost Defaults */}
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Cost Defaults</h2>
            <p
              style={{
                fontSize: '13px',
                color: '#6d7175',
                marginTop: 0,
                marginBottom: '12px',
              }}
            >
              Default cost values used when calculating product and bundle
              margins.
            </p>
            <NumberField
              label="Default Shipping Cost"
              sublabel="Applied to products without individual shipping costs"
              value={form.defaultShippingCost}
              onChange={(val) => updateField('defaultShippingCost', val)}
              prefix="$"
            />
            <NumberField
              label="Payment Processing %"
              sublabel="Credit card processing percentage rate"
              value={form.paymentProcessingPct}
              onChange={(val) => updateField('paymentProcessingPct', val)}
              suffix="%"
              step={0.1}
            />
            <NumberField
              label="Payment Processing Flat Fee"
              sublabel="Fixed fee per transaction"
              value={form.paymentProcessingFlat}
              onChange={(val) => updateField('paymentProcessingFlat', val)}
              prefix="$"
            />
          </div>

          {/* Section 2: Bundle Engine */}
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Bundle Engine</h2>
            <p
              style={{
                fontSize: '13px',
                color: '#6d7175',
                marginTop: 0,
                marginBottom: '12px',
              }}
            >
              Configure automatic bundle generation behavior.
            </p>
            <ToggleField
              label="Auto-Generate Bundles"
              sublabel="Automatically create bundle suggestions based on product data"
              value={form.autoGenerateBundles}
              onChange={(val) => updateField('autoGenerateBundles', val)}
            />
            <NumberField
              label="Minimum Bundle Margin %"
              sublabel="Only generate bundles above this margin threshold"
              value={form.minBundleMarginPct}
              onChange={(val) => updateField('minBundleMarginPct', val)}
              suffix="%"
              step={1}
            />
            <NumberField
              label="Max Products per Bundle"
              sublabel="Maximum number of products in a generated bundle"
              value={form.maxBundleProducts}
              onChange={(val) => updateField('maxBundleProducts', Math.round(val))}
              step={1}
              min={2}
            />
            <ToggleField
              label="Include Dead Stock"
              sublabel="Include slow-moving inventory in bundle suggestions"
              value={form.includeDeadStock}
              onChange={(val) => updateField('includeDeadStock', val)}
            />
            <NumberField
              label="Dead Stock Days Threshold"
              sublabel="Days without a sale before a product is considered dead stock"
              value={form.deadStockDaysThreshold}
              onChange={(val) =>
                updateField('deadStockDaysThreshold', Math.round(val))
              }
              step={1}
              min={1}
              suffix="days"
            />
          </div>

          {/* Section 3: Display Settings */}
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Display Settings</h2>
            <p
              style={{
                fontSize: '13px',
                color: '#6d7175',
                marginTop: 0,
                marginBottom: '12px',
              }}
            >
              Control where bundles are displayed in your storefront.
            </p>
            <ToggleField
              label="Show on Product Page"
              sublabel="Display bundle offers on individual product pages"
              value={form.showOnProductPage}
              onChange={(val) => updateField('showOnProductPage', val)}
            />
            <ToggleField
              label="Show on Cart Page"
              sublabel="Display bundle offers on the shopping cart page"
              value={form.showOnCartPage}
              onChange={(val) => updateField('showOnCartPage', val)}
            />
            <ToggleField
              label="Show at Checkout"
              sublabel="Display upsell offers during the checkout process"
              value={form.showAtCheckout}
              onChange={(val) => updateField('showAtCheckout', val)}
            />
            <ToggleField
              label="Show on Exit Intent"
              sublabel="Display bundle popup when the user tries to leave"
              value={form.showOnExitIntent}
              onChange={(val) => updateField('showOnExitIntent', val)}
            />
          </div>

          {/* Section 4: Widget Theming */}
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Widget Theming</h2>
            <p
              style={{
                fontSize: '13px',
                color: '#6d7175',
                marginTop: 0,
                marginBottom: '12px',
              }}
            >
              Customize the look and feel of your storefront bundle widgets.
            </p>

            {/* Color pickers — grouped */}
            {([
              { heading: 'General', items: [
                ['widgetCardBackground', 'Card Background', 'Bundle card background'],
                ['widgetSelectedBgColor', 'Selected Background', 'Background when a card is selected'],
                ['widgetBorderColor', 'Border Color', 'Card border color'],
                ['widgetBlockTitleColor', 'Block Title Color', 'Widget heading / block title'],
              ]},
              { heading: 'Text', items: [
                ['widgetTitleColor', 'Title Color', 'Item title text color'],
                ['widgetSubtitleColor', 'Subtitle Color', 'Subtitle and variant text'],
                ['widgetPriceColor', 'Price Color', 'Bundle price text'],
                ['widgetOriginalPriceColor', 'Original Price Color', 'Strikethrough price text'],
              ]},
              { heading: 'Button', items: [
                ['widgetPrimaryColor', 'Primary Color', 'Button and accent color'],
                ['widgetButtonTextColor', 'Button Text Color', 'Text inside buttons'],
              ]},
              { heading: 'Badge', items: [
                ['widgetBadgeBackground', 'Badge Background', 'Savings badge background'],
                ['widgetBadgeTextColor', 'Badge Text Color', 'Savings badge text'],
                ['widgetSavingsBadgeBgColor', 'Savings Badge Background', 'Savings percentage badge bg'],
                ['widgetSavingsBadgeTextColor', 'Savings Badge Text', 'Savings percentage badge text'],
              ]},
              { heading: 'Label', items: [
                ['widgetLabelBgColor', 'Label Background', 'Tier label background'],
                ['widgetLabelTextColor', 'Label Text Color', 'Tier label text'],
              ]},
              { heading: 'Other', items: [
                ['widgetPrimaryColorHover', 'Primary Hover Color', 'Button hover state'],
                ['widgetCardHoverBgColor', 'Card Hover Background', 'Card background on hover'],
                ['widgetTextColor', 'Text Color', 'Main text color'],
                ['widgetSecondaryTextColor', 'Secondary Text Color', 'Subtitle and meta text'],
              ]},
            ] as const).map((group) => (
              <div key={group.heading}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#6d7175', margin: '16px 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {group.heading}
                </h4>
                {group.items.map(([key, label, sublabel]) => (
                  <div key={key} style={fieldRowStyle}>
                    <div>
                      <div style={labelStyle}>{label}</div>
                      <div style={sublabelStyle}>{sublabel}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '4px',
                          border: '1px solid #c9cccf',
                          backgroundColor: (form as any)[key] || '#000000',
                        }}
                      />
                      <input
                        type="color"
                        value={(form as any)[key] || '#000000'}
                        onChange={(e) => updateField(key as keyof ShopSettingsDto, e.target.value as any)}
                        style={{
                          width: '40px',
                          height: '32px',
                          padding: '2px',
                          border: '1px solid #c9cccf',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* Border Radius slider */}
            <div style={fieldRowStyle}>
              <div>
                <div style={labelStyle}>Border Radius</div>
                <div style={sublabelStyle}>Corner roundness (0–24px)</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="range"
                  min={0}
                  max={24}
                  step={1}
                  value={form.widgetBorderRadius ?? 10}
                  onChange={(e) => updateField('widgetBorderRadius', parseInt(e.target.value, 10))}
                  style={{ width: '120px' }}
                />
                <span style={{ fontSize: '13px', color: '#6d7175', minWidth: '32px' }}>
                  {form.widgetBorderRadius ?? 10}px
                </span>
              </div>
            </div>

            {/* Button Text */}
            <div style={fieldRowStyle}>
              <div>
                <div style={labelStyle}>Button Text</div>
                <div style={sublabelStyle}>Call-to-action text on bundle cards</div>
              </div>
              <input
                type="text"
                value={form.widgetButtonText ?? 'Add Bundle to Cart'}
                onChange={(e) => updateField('widgetButtonText', e.target.value)}
                maxLength={50}
                style={{
                  padding: '6px 10px',
                  border: '1px solid #c9cccf',
                  borderRadius: '4px',
                  fontSize: '14px',
                  width: '200px',
                }}
              />
            </div>

            {/* Layout presets */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>Layout</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {[
                  { value: 'vertical', label: 'Vertical', icon: '\u25ad\n\u25ad\n\u25ad' },
                  { value: 'horizontal', label: 'Horizontal', icon: '\u25ad \u25ad \u25ad' },
                  { value: 'compact', label: 'Compact', icon: '\u2500\n\u2500\n\u2500' },
                  { value: 'grid', label: 'Grid', icon: '\u25ad \u25ad\n\u25ad \u25ad' },
                ].map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => updateField('widgetLayout', opt.value)}
                    style={{
                      border: form.widgetLayout === opt.value ? '2px solid #2563eb' : '1px solid #d1d5db',
                      borderRadius: '8px',
                      padding: '12px 8px',
                      textAlign: 'center' as const,
                      cursor: 'pointer',
                      background: form.widgetLayout === opt.value ? '#eff6ff' : '#fff',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontFamily: 'monospace', fontSize: '11px', lineHeight: '1.4', marginBottom: '6px', whiteSpace: 'pre' as const, color: '#6b7280' }}>
                      {opt.icon}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: form.widgetLayout === opt.value ? 600 : 400 }}>
                      {opt.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Global Font Size slider (base) */}
            <div style={fieldRowStyle}>
              <div>
                <div style={labelStyle}>Base Font Size</div>
                <div style={sublabelStyle}>Widget base font size (10-24px)</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="range"
                  min={10}
                  max={24}
                  step={1}
                  value={form.widgetFontSize ?? 14}
                  onChange={(e) => updateField('widgetFontSize', parseInt(e.target.value, 10))}
                  style={{ width: '120px' }}
                />
                <span style={{ fontSize: '13px', color: '#6d7175', minWidth: '32px' }}>
                  {form.widgetFontSize ?? 14}px
                </span>
              </div>
            </div>

            {/* Global Font Weight select (base) */}
            <div style={fieldRowStyle}>
              <div>
                <div style={labelStyle}>Base Font Weight</div>
                <div style={sublabelStyle}>Widget base text weight</div>
              </div>
              <select
                value={form.widgetFontWeight ?? 'normal'}
                onChange={(e) => updateField('widgetFontWeight', e.target.value)}
                style={{
                  padding: '6px 10px',
                  border: '1px solid #c9cccf',
                  borderRadius: '4px',
                  fontSize: '14px',
                  width: '140px',
                }}
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
              </select>
            </div>

            {/* Per-Element Typography */}
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#6d7175', margin: '20px 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Per-Element Typography
            </h4>
            {([
              ['Block Title', 'widgetBlockTitleFontSize', 'widgetBlockTitleFontWeight', 18, 'bold'] as const,
              ['Item Title', 'widgetItemTitleFontSize', 'widgetItemTitleFontWeight', 14, 'normal'] as const,
              ['Subtitle', 'widgetSubtitleFontSize', 'widgetSubtitleFontWeight', 13, 'normal'] as const,
              ['Price', 'widgetPriceFontSize', 'widgetPriceFontWeight', 16, 'bold'] as const,
              ['Badge', 'widgetBadgeFontSize', 'widgetBadgeFontWeight', 12, 'bold'] as const,
              ['Button', 'widgetButtonFontSize', 'widgetButtonFontWeight', 14, 'bold'] as const,
            ]).map(([label, sizeKey, weightKey, defaultSize, defaultWeight]) => (
              <div key={sizeKey} style={{ ...fieldRowStyle, gap: '12px' }}>
                <div style={{ flex: '0 0 120px' }}>
                  <div style={labelStyle}>{label}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
                  <input
                    type="range"
                    min={8}
                    max={32}
                    step={1}
                    value={(form as any)[sizeKey] ?? defaultSize}
                    onChange={(e) => updateField(sizeKey as keyof ShopSettingsDto, parseInt(e.target.value, 10) as any)}
                    style={{ width: '100px' }}
                  />
                  <span style={{ fontSize: '13px', color: '#6d7175', minWidth: '36px', textAlign: 'right' }}>
                    {(form as any)[sizeKey] ?? defaultSize}px
                  </span>
                  <select
                    value={(form as any)[weightKey] ?? defaultWeight}
                    onChange={(e) => updateField(weightKey as keyof ShopSettingsDto, e.target.value as any)}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #c9cccf',
                      borderRadius: '4px',
                      fontSize: '13px',
                      width: '90px',
                    }}
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                  </select>
                </div>
              </div>
            ))}

            {/* Card Shadow select */}
            <div style={fieldRowStyle}>
              <div>
                <div style={labelStyle}>Card Shadow</div>
                <div style={sublabelStyle}>Shadow intensity on bundle cards</div>
              </div>
              <select
                value={form.widgetCardShadow ?? 'subtle'}
                onChange={(e) => updateField('widgetCardShadow', e.target.value)}
                style={{
                  padding: '6px 10px',
                  border: '1px solid #c9cccf',
                  borderRadius: '4px',
                  fontSize: '14px',
                  width: '140px',
                }}
              >
                <option value="none">None</option>
                <option value="subtle">Subtle</option>
                <option value="medium">Medium</option>
                <option value="strong">Strong</option>
              </select>
            </div>

            {/* Price Display */}
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#6d7175', margin: '20px 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Price Display
            </h4>
            <ToggleField
              label="Show prices without decimals"
              sublabel="Display $25 instead of $25.00"
              value={form.priceRoundingEnabled}
              onChange={(val) => updateField('priceRoundingEnabled', val)}
            />

            {/* Show Savings Badge toggle */}
            <ToggleField
              label="Show Savings Badge"
              sublabel="Display the savings percentage badge on bundle cards"
              value={form.widgetShowSavings}
              onChange={(val) => updateField('widgetShowSavings', val)}
            />

            {/* Show Compare-At Price toggle */}
            <ToggleField
              label="Show Compare-At Price"
              sublabel="Show original strikethrough price on bundle items"
              value={form.widgetShowCompareAtPrice}
              onChange={(val) => updateField('widgetShowCompareAtPrice', val)}
            />

            {/* Custom CSS textarea */}
            <div style={{ ...fieldRowStyle, flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
              <div>
                <div style={labelStyle}>Custom CSS</div>
                <div style={sublabelStyle}>Add custom CSS to further customize widget appearance (max 5000 chars)</div>
              </div>
              <textarea
                value={form.widgetCustomCss ?? ''}
                onChange={(e) => updateField('widgetCustomCss', e.target.value || null)}
                maxLength={5000}
                rows={6}
                placeholder={`.bundlify-card { /* your styles */ }`}
                style={{
                  padding: '8px 10px',
                  border: '1px solid #c9cccf',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  resize: 'vertical',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Sticky Add to Cart */}
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Sticky Add to Cart</h2>
            <p
              style={{
                fontSize: '13px',
                color: '#6d7175',
                marginTop: 0,
                marginBottom: '12px',
              }}
            >
              Show a floating bar when the bundle widget scrolls out of view.
            </p>
            <ToggleField
              label="Enable sticky bar"
              sublabel="Show floating bar when bundle widget scrolls out of view"
              value={form.stickyBarEnabled ?? false}
              onChange={(val) => updateField('stickyBarEnabled', val)}
            />
            {form.stickyBarEnabled && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                {([
                  ['stickyBarBgColor', 'Background', '#ffffff'] as const,
                  ['stickyBarTextColor', 'Text Color', '#111827'] as const,
                  ['stickyBarButtonBgColor', 'Button Background', '#2563eb'] as const,
                  ['stickyBarButtonTextColor', 'Button Text', '#ffffff'] as const,
                ]).map(([key, label, fallback]) => (
                  <div key={key} style={fieldRowStyle}>
                    <div>
                      <div style={labelStyle}>{label}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '4px',
                          border: '1px solid #c9cccf',
                          backgroundColor: (form as any)[key] || fallback,
                        }}
                      />
                      <input
                        type="color"
                        value={(form as any)[key] || fallback}
                        onChange={(e) => updateField(key as keyof ShopSettingsDto, e.target.value as any)}
                        style={{
                          width: '40px',
                          height: '32px',
                          padding: '2px',
                          border: '1px solid #c9cccf',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 5: Cart Drawer */}
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Cart Drawer</h2>
            <p
              style={{
                fontSize: '13px',
                color: '#6d7175',
                marginTop: 0,
                marginBottom: '12px',
              }}
            >
              Show a slide-out cart drawer with upsell bundles when a customer
              adds a product to cart.
            </p>
            <ToggleField
              label="Enable Cart Drawer"
              sublabel="Intercept add-to-cart and show a drawer with cart items and upsells"
              value={form.cartDrawerEnabled}
              onChange={(val) => updateField('cartDrawerEnabled', val)}
            />
            <NumberField
              label="Free Shipping Threshold"
              sublabel="Display a progress bar towards free shipping. Leave at 0 to disable."
              value={form.freeShippingThreshold ?? 0}
              onChange={(val) => updateField('freeShippingThreshold', val || null)}
              prefix="$"
              step={1}
              min={0}
            />

            {/* Urgency Timer sub-section */}
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#6d7175', margin: '20px 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Urgency Timer
            </h4>
            <NumberField
              label="Timer Minutes"
              sublabel="Countdown timer in the cart drawer. Set to 0 to disable."
              value={form.cartTimerMinutes ?? 0}
              onChange={(val) => updateField('cartTimerMinutes', Math.round(val))}
              step={1}
              min={0}
              suffix="min"
            />
            <div style={fieldRowStyle}>
              <div>
                <div style={labelStyle}>Timer Text</div>
                <div style={sublabelStyle}>{'Use {{timer}} as the countdown placeholder'}</div>
              </div>
              <input
                type="text"
                value={form.cartTimerText ?? 'Your cart will expire in {{timer}}'}
                onChange={(e) => updateField('cartTimerText', e.target.value)}
                maxLength={255}
                style={{
                  padding: '6px 10px',
                  border: '1px solid #c9cccf',
                  borderRadius: '4px',
                  fontSize: '14px',
                  width: '280px',
                }}
              />
            </div>
          </div>

          {/* Section 5: Multi-Currency */}
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Multi-Currency</h2>
            <p
              style={{
                fontSize: '13px',
                color: '#6d7175',
                marginTop: 0,
                marginBottom: '12px',
              }}
            >
              Configure multi-currency support for international storefronts.
            </p>
            <ToggleField
              label="Enable Multi-Currency"
              sublabel="Allow bundle prices to be displayed in multiple currencies"
              value={form.multiCurrencyEnabled}
              onChange={(val) => updateField('multiCurrencyEnabled', val)}
            />
            <div style={fieldRowStyle}>
              <div>
                <div style={labelStyle}>Display Currency</div>
                <div style={sublabelStyle}>
                  Primary currency for displaying bundle prices
                </div>
              </div>
              <select
                value={form.displayCurrency ?? 'USD'}
                onChange={(e) => updateField('displayCurrency', e.target.value)}
                style={{
                  padding: '6px 10px',
                  border: '1px solid #c9cccf',
                  borderRadius: '4px',
                  fontSize: '14px',
                  width: '100px',
                }}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
                <option value="JPY">JPY</option>
              </select>
            </div>
          </div>

          {/* Section 6: Widget Settings */}
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Widget Settings</h2>
            <p
              style={{
                fontSize: '13px',
                color: '#6d7175',
                marginTop: 0,
                marginBottom: '12px',
              }}
            >
              Enable or disable specific widget features.
            </p>
            <ToggleField
              label="Bundle Widget"
              sublabel="Master switch for the bundle display widget on your store"
              value={form.bundleWidgetEnabled}
              onChange={(val) => updateField('bundleWidgetEnabled', val)}
            />
            <ToggleField
              label="Checkout Upsell"
              sublabel="Show bundle upsells during the checkout flow"
              value={form.checkoutUpsellEnabled}
              onChange={(val) => updateField('checkoutUpsellEnabled', val)}
            />
            <ToggleField
              label="Exit Intent Popup"
              sublabel="Show a bundle offer when users try to navigate away"
              value={form.exitIntentEnabled}
              onChange={(val) => updateField('exitIntentEnabled', val)}
            />
          </div>

          {/* Section 7: Product Price Override */}
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Product Price Override</h2>
            <p
              style={{
                fontSize: '13px',
                color: '#6d7175',
                marginTop: 0,
                marginBottom: '12px',
              }}
            >
              Override the product page price to show the bundle deal price.
            </p>
            <ToggleField
              label="Update theme product price"
              sublabel="Replace the theme's product price with the bundle deal price"
              value={form.updateThemePrice}
              onChange={(val) => updateField('updateThemePrice', val)}
            />
            {form.updateThemePrice && (
              <div style={fieldRowStyle}>
                <div>
                  <div style={labelStyle}>Price Mode</div>
                  <div style={sublabelStyle}>How the overridden price is calculated</div>
                </div>
                <select
                  value={form.themePriceMode ?? 'per_item'}
                  onChange={(e) => updateField('themePriceMode', e.target.value)}
                  style={{
                    padding: '6px 10px',
                    border: '1px solid #c9cccf',
                    borderRadius: '4px',
                    fontSize: '14px',
                    width: '160px',
                  }}
                >
                  <option value="per_item">Per item</option>
                  <option value="bundle_price">Bundle price</option>
                </select>
              </div>
            )}
          </div>

          {/* Section 8: Access Control */}
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Access Control</h2>
            <p
              style={{
                fontSize: '13px',
                color: '#6d7175',
                marginTop: 0,
                marginBottom: '12px',
              }}
            >
              Control who can see and use bundle deals.
            </p>
            <ToggleField
              label="Exclude B2B customers"
              sublabel="Hide bundle deals from customers tagged with 'b2b' or 'wholesale'"
              value={form.excludeB2B}
              onChange={(val) => updateField('excludeB2B', val)}
            />
            <ToggleField
              label="Discount only via widget"
              sublabel="Bundle discounts only apply when added through the widget. Prevents discount code stacking."
              value={form.discountOnlyViaWidget}
              onChange={(val) => updateField('discountOnlyViaWidget', val)}
            />
          </div>

          {/* Bottom save button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
            {saved && (
              <span style={{ fontSize: '13px', color: '#1a5632', fontWeight: 500 }}>
                Settings saved
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '8px 20px',
                backgroundColor: saving ? '#e4e5e7' : '#008060',
                color: saving ? '#6d7175' : '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
