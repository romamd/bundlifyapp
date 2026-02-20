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

          {/* Section 4: Cart Drawer */}
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
