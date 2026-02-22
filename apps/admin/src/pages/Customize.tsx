import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '../stores/settings.store';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';
import { LoadingState } from '../components/common/LoadingState';
import { WidgetPreview } from '../components/customize/WidgetPreview';
import {
  ToggleField,
  fieldRowStyle,
  labelStyle,
  sublabelStyle,
} from '../components/common/FormFields';
import type { ShopSettingsDto } from '@bundlify/shared-types';

export function Customize() {
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

  if (loading) {
    return (
      <div style={{ padding: '40px' }}>
        <LoadingState />
      </div>
    );
  }

  if (!settings) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#6d7175' }}>
        Unable to load settings.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
      {/* Left panel: controls */}
      <div style={{
        width: '480px',
        flexShrink: 0,
        overflowY: 'auto',
        padding: '20px',
        borderRight: '1px solid #e1e3e5',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <h1 style={{ fontSize: '24px', margin: 0 }}>Customize</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {saved && (
              <span style={{ fontSize: '13px', color: '#1a5632', fontWeight: 500 }}>
                Saved
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving || loading}
              style={{
                padding: '8px 20px',
                backgroundColor: saving || loading ? '#e4e5e7' : '#008060',
                color: saving || loading ? '#6d7175' : '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: saving || loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            color: '#8c1a1a',
            padding: '12px',
            marginBottom: '12px',
            backgroundColor: '#ffd2d2',
            borderRadius: '8px',
          }}>
            Error: {error}
          </div>
        )}

        {/* Colors section */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Colors</h2>
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
            { heading: 'Free Gift', items: [
              ['widgetGiftBgColor', 'Gift Background', 'Gift card background'],
              ['widgetGiftTextColor', 'Gift Text', 'Gift card text'],
              ['widgetGiftSelectedBgColor', 'Gift Selected Bg', 'Gift selected state'],
              ['widgetGiftSelectedTextColor', 'Gift Selected Text', 'Gift selected text'],
            ]},
            { heading: 'Upsell', items: [
              ['widgetUpsellBgColor', 'Upsell Background', 'Upsell card background'],
              ['widgetUpsellTextColor', 'Upsell Text', 'Upsell card text'],
              ['widgetUpsellSelectedBgColor', 'Upsell Selected Bg', 'Upsell selected state'],
              ['widgetUpsellSelectedTextColor', 'Upsell Selected Text', 'Upsell selected text'],
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
        </div>

        {/* Layout & Spacing */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Layout & Spacing</h2>

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

          {/* Border Radius slider */}
          <div style={fieldRowStyle}>
            <div>
              <div style={labelStyle}>Border Radius</div>
              <div style={sublabelStyle}>Corner roundness (0-24px)</div>
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

          {/* Spacing slider */}
          <div style={fieldRowStyle}>
            <div>
              <div style={labelStyle}>Spacing</div>
              <div style={sublabelStyle}>Element spacing (0-40px)</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="range"
                min={0}
                max={40}
                step={1}
                value={form.widgetSpacing ?? 12}
                onChange={(e) => updateField('widgetSpacing', parseInt(e.target.value, 10))}
                style={{ width: '120px' }}
              />
              <span style={{ fontSize: '13px', color: '#6d7175', minWidth: '32px' }}>
                {form.widgetSpacing ?? 12}px
              </span>
            </div>
          </div>

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
        </div>

        {/* Typography */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Typography</h2>

          {/* Global Font Size slider */}
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

          {/* Global Font Weight select */}
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
            ['Label', 'widgetLabelFontSize', 'widgetLabelFontWeight', 11, 'bold'] as const,
            ['Free Gift', 'widgetGiftFontSize', 'widgetGiftFontWeight', 13, 'normal'] as const,
            ['Upsell', 'widgetUpsellFontSize', 'widgetUpsellFontWeight', 13, 'normal'] as const,
            ['Unit Label', 'widgetUnitLabelFontSize', 'widgetUnitLabelFontWeight', 13, 'bold'] as const,
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
        </div>

        {/* Price Display & Button */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Price Display & Button</h2>

          <ToggleField
            label="Show prices without decimals"
            sublabel="Display $25 instead of $25.00"
            value={form.priceRoundingEnabled}
            onChange={(val) => updateField('priceRoundingEnabled', val)}
          />
          <ToggleField
            label="Show Savings Badge"
            sublabel="Display the savings percentage badge on bundle cards"
            value={form.widgetShowSavings}
            onChange={(val) => updateField('widgetShowSavings', val)}
          />
          <ToggleField
            label="Show Compare-At Price"
            sublabel="Show original strikethrough price on bundle items"
            value={form.widgetShowCompareAtPrice}
            onChange={(val) => updateField('widgetShowCompareAtPrice', val)}
          />

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
        </div>

        {/* Custom CSS */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Custom CSS</h2>
          <div style={{ ...fieldRowStyle, flexDirection: 'column', alignItems: 'stretch', gap: '8px', borderBottom: 'none' }}>
            <div>
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
          <p style={{ fontSize: '13px', color: '#6d7175', marginTop: 0, marginBottom: '12px' }}>
            Show a floating bar when the bundle widget scrolls out of view.
          </p>
          <ToggleField
            label="Enable sticky bar"
            sublabel="Show floating bar when bundle widget scrolls out of view"
            value={form.stickyBarEnabled ?? false}
            onChange={(val) => updateField('stickyBarEnabled', val)}
          />
          {form.stickyBarEnabled && (
            <>
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

              {/* Button Text */}
              <div style={{ ...fieldRowStyle, marginTop: '12px' }}>
                <div>
                  <div style={labelStyle}>Button Text</div>
                  <div style={sublabelStyle}>Call-to-action text on sticky bar</div>
                </div>
                <input
                  type="text"
                  value={form.stickyBarButtonText ?? 'Choose Bundle'}
                  onChange={(e) => updateField('stickyBarButtonText', e.target.value)}
                  maxLength={100}
                  style={{
                    padding: '6px 10px',
                    border: '1px solid #c9cccf',
                    borderRadius: '4px',
                    fontSize: '14px',
                    width: '200px',
                  }}
                />
              </div>

              {/* Title Font Size */}
              <div style={fieldRowStyle}>
                <div>
                  <div style={labelStyle}>Title Font Size</div>
                  <div style={sublabelStyle}>Sticky bar title size (8-32px)</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="range"
                    min={8}
                    max={32}
                    step={1}
                    value={form.stickyBarTitleFontSize ?? 14}
                    onChange={(e) => updateField('stickyBarTitleFontSize', parseInt(e.target.value, 10))}
                    style={{ width: '120px' }}
                  />
                  <span style={{ fontSize: '13px', color: '#6d7175', minWidth: '32px' }}>
                    {form.stickyBarTitleFontSize ?? 14}px
                  </span>
                </div>
              </div>

              {/* Title Font Weight */}
              <div style={fieldRowStyle}>
                <div>
                  <div style={labelStyle}>Title Font Weight</div>
                  <div style={sublabelStyle}>Sticky bar title weight</div>
                </div>
                <select
                  value={form.stickyBarTitleFontWeight ?? 'normal'}
                  onChange={(e) => updateField('stickyBarTitleFontWeight', e.target.value)}
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

              {/* Button Font Size */}
              <div style={fieldRowStyle}>
                <div>
                  <div style={labelStyle}>Button Font Size</div>
                  <div style={sublabelStyle}>Sticky bar button text size (8-32px)</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="range"
                    min={8}
                    max={32}
                    step={1}
                    value={form.stickyBarButtonFontSize ?? 14}
                    onChange={(e) => updateField('stickyBarButtonFontSize', parseInt(e.target.value, 10))}
                    style={{ width: '120px' }}
                  />
                  <span style={{ fontSize: '13px', color: '#6d7175', minWidth: '32px' }}>
                    {form.stickyBarButtonFontSize ?? 14}px
                  </span>
                </div>
              </div>

              {/* Button Font Weight */}
              <div style={fieldRowStyle}>
                <div>
                  <div style={labelStyle}>Button Font Weight</div>
                  <div style={sublabelStyle}>Sticky bar button text weight</div>
                </div>
                <select
                  value={form.stickyBarButtonFontWeight ?? 'bold'}
                  onChange={(e) => updateField('stickyBarButtonFontWeight', e.target.value)}
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

              {/* Button Padding */}
              <div style={fieldRowStyle}>
                <div>
                  <div style={labelStyle}>Button Padding</div>
                  <div style={sublabelStyle}>Sticky bar button padding (4-30px)</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="range"
                    min={4}
                    max={30}
                    step={1}
                    value={form.stickyBarButtonPadding ?? 15}
                    onChange={(e) => updateField('stickyBarButtonPadding', parseInt(e.target.value, 10))}
                    style={{ width: '120px' }}
                  />
                  <span style={{ fontSize: '13px', color: '#6d7175', minWidth: '32px' }}>
                    {form.stickyBarButtonPadding ?? 15}px
                  </span>
                </div>
              </div>

              {/* Button Border Radius */}
              <div style={fieldRowStyle}>
                <div>
                  <div style={labelStyle}>Button Border Radius</div>
                  <div style={sublabelStyle}>Sticky bar button corner roundness (0-24px)</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="range"
                    min={0}
                    max={24}
                    step={1}
                    value={form.stickyBarButtonBorderRadius ?? 8}
                    onChange={(e) => updateField('stickyBarButtonBorderRadius', parseInt(e.target.value, 10))}
                    style={{ width: '120px' }}
                  />
                  <span style={{ fontSize: '13px', color: '#6d7175', minWidth: '32px' }}>
                    {form.stickyBarButtonBorderRadius ?? 8}px
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right panel: live preview */}
      <div style={{
        flex: 1,
        padding: '20px 32px',
        backgroundColor: '#f6f6f7',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <div style={{
          fontSize: '13px',
          fontWeight: 600,
          color: '#6d7175',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '16px',
          alignSelf: 'flex-start',
        }}>
          Live Preview
        </div>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          <WidgetPreview settings={form} />
        </div>
      </div>
    </div>
  );
}
