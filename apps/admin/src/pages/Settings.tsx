import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettingsStore } from '../stores/settings.store';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';
import { LoadingState } from '../components/common/LoadingState';
import { useToast } from '../components/common/Toast';
import { Button } from '../components/common/Button';
import {
  NumberField,
  ToggleField,
  fieldRowStyle,
  labelStyle,
  sublabelStyle,
} from '../components/common/FormFields';
import type { ShopSettingsDto } from '@bundlify/shared-types';

export function Settings() {
  const fetch = useAuthenticatedFetch();
  const { settings, loading, saving, error, fetchSettings, updateSettings } =
    useSettingsStore();

  const { showToast } = useToast();
  const [form, setForm] = useState<Partial<ShopSettingsDto>>({});

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
    await updateSettings(fetch, form);
    showToast('Settings saved');
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

  const sections = [
    { id: 'cost-defaults', label: 'Cost Defaults' },
    { id: 'bundle-engine', label: 'Bundle Engine' },
    { id: 'display-settings', label: 'Display Settings' },
    { id: 'cart-drawer', label: 'Cart Drawer' },
    { id: 'multi-currency', label: 'Multi-Currency' },
    { id: 'widget-settings', label: 'Widget Settings' },
    { id: 'price-override', label: 'Price Override' },
    { id: 'access-control', label: 'Access Control' },
  ];

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
        <Button onClick={handleSave} disabled={saving || loading}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
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

      {/* Quick navigation */}
      {!loading && settings && (
        <div style={{
          display: 'flex',
          gap: '4px',
          flexWrap: 'wrap',
          marginBottom: '16px',
          padding: '10px 12px',
          backgroundColor: '#f6f6f7',
          borderRadius: '8px',
        }}>
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                color: '#5c5f62',
                backgroundColor: '#ffffff',
                border: '1px solid #e1e3e5',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.backgroundColor = '#f1f8f5'; (e.target as HTMLElement).style.color = '#008060'; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.backgroundColor = '#ffffff'; (e.target as HTMLElement).style.color = '#5c5f62'; }}
            >
              {s.label}
            </button>
          ))}
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
          <div id="cost-defaults" style={sectionStyle}>
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
          <div id="bundle-engine" style={sectionStyle}>
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
          <div id="display-settings" style={sectionStyle}>
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

          {/* Widget Styling link */}
          <div style={{
            ...sectionStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f1f8f5',
            border: '1px solid #aee9d1',
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#202223' }}>Widget Styling</div>
              <div style={{ fontSize: '13px', color: '#6d7175', marginTop: '2px' }}>
                Colors, typography, layout, and live preview have moved to the Customize page.
              </div>
            </div>
            <Link
              to="/customize"
              style={{
                padding: '8px 16px',
                backgroundColor: '#008060',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              Go to Customize
            </Link>
          </div>

          {/* Section 5: Cart Drawer */}
          <div id="cart-drawer" style={sectionStyle}>
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
          <div id="multi-currency" style={sectionStyle}>
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
          <div id="widget-settings" style={sectionStyle}>
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
          <div id="price-override" style={sectionStyle}>
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
          <div id="access-control" style={sectionStyle}>
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
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
