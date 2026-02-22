import React, { useState, useMemo } from 'react';
import type { ProductDto, CreateBundleDto, BundleDto } from '@bundlify/shared-types';
import { calculateBundleMargin } from '@bundlify/margin-engine';
import {
  BundleProductPicker,
  type SelectedBundleItem,
} from './BundleProductPicker';
import { BundlePreview } from './BundlePreview';
import { DiscountSlider } from './DiscountSlider';
import { MarginImpactCard } from './MarginImpactCard';
import { ProductSearchDropdown } from '../common/ProductSearchDropdown';
import { CollectionSearchDropdown } from '../common/CollectionSearchDropdown';

interface BundleWizardProps {
  onCancel: () => void;
  onSubmit: (data: CreateBundleDto) => Promise<void>;
  products: ProductDto[];
  editBundle?: BundleDto | null;
  fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

const BUNDLE_TYPE_OPTIONS = [
  {
    value: 'FIXED',
    label: 'Fixed Bundle',
    description:
      'Curate a set of specific products sold together at a fixed discount. Best for themed collections or starter kits.',
  },
  {
    value: 'VOLUME',
    label: 'Volume Discount',
    description:
      'Offer tiered pricing \u2014 buy more, save more. Ideal for quantity breaks on single or multiple products.',
  },
  {
    value: 'BOGO',
    label: 'Buy X Get Y',
    description:
      'Buy one or more products and get another free or at a discount. Classic promotional mechanic.',
  },
  {
    value: 'CROSS_SELL',
    label: 'Cross-Sell',
    description:
      'Recommend complementary products that go well together. Boost AOV with smart pairings.',
  },
  {
    value: 'COLLECTION',
    label: 'Collection Bundle',
    description:
      'Let customers pick products from a collection to build their own bundle at a discount.',
  },
  {
    value: 'MIX_MATCH',
    label: 'Mix & Match',
    description:
      'Customers choose any combination of products to create their personalized bundle.',
  },
  {
    value: 'DEAD_STOCK',
    label: 'Dead Stock Clearance',
    description:
      'Pair slow-moving inventory with popular items to clear stock while maintaining margins.',
  },
] as const;

const TRIGGER_TYPE_OPTIONS = [
  { value: 'PRODUCT_PAGE', label: 'Product Page' },
  { value: 'CART_PAGE', label: 'Cart Page' },
  { value: 'CHECKOUT', label: 'Checkout Upsell' },
  { value: 'EXIT_INTENT', label: 'Exit Intent Popup' },
] as const;

const COUNTDOWN_SUGGESTIONS = [
  'Hurry! Offer expires in {{timer}}',
  'Deal ends in {{timer}} -- don\'t miss out!',
  'Only {{timer}} left at this price',
  'Flash sale! {{timer}} remaining',
  'This bundle disappears in {{timer}}',
];

const NAME_SUGGESTIONS = [
  'Ultimate Savings Bundle',
  'Best-Seller Combo Pack',
  'Complete Care Kit',
  'Starter Essentials Set',
  'Premium Value Bundle',
];

export function BundleWizard({
  onCancel,
  onSubmit,
  products,
  editBundle,
  fetch: authenticatedFetch,
}: BundleWizardProps) {
  const isEditing = !!editBundle;
  const [step, setStep] = useState(0);
  const [bundleType, setBundleType] = useState<string>('FIXED');
  const [selectedItems, setSelectedItems] = useState<SelectedBundleItem[]>([]);
  const [discountPct, setDiscountPct] = useState(10);
  const [triggerType, setTriggerType] = useState('PRODUCT_PAGE');
  const [displayRules, setDisplayRules] = useState<
    { targetType: 'PRODUCT' | 'COLLECTION'; targetId: string }[]
  >([]);
  const [name, setName] = useState('');
  const [volumeTiers, setVolumeTiers] = useState<
    { minQuantity: number; discountPct: number; label: string }[]
  >([
    { minQuantity: 2, discountPct: 10, label: '' },
    { minQuantity: 3, discountPct: 20, label: '' },
  ]);
  const [countdownEnabled, setCountdownEnabled] = useState(false);
  const [countdownType, setCountdownType] = useState('fixed');
  const [countdownDuration, setCountdownDuration] = useState(15);
  const [countdownTitle, setCountdownTitle] = useState('Hurry! Offer expires in {{timer}}');
  const [countdownBgColor, setCountdownBgColor] = useState('#111827');
  const [countdownTextColor, setCountdownTextColor] = useState('#ffffff');
  const [countdownTitleFontSize, setCountdownTitleFontSize] = useState<number>(editBundle?.countdownTitleFontSize ?? 14);
  const [countdownTitleFontWeight, setCountdownTitleFontWeight] = useState<string>(editBundle?.countdownTitleFontWeight ?? 'normal');
  const [countdownTitleAlignment, setCountdownTitleAlignment] = useState<string>(editBundle?.countdownTitleAlignment ?? 'center');
  const [bogoGetQuantity, setBogoGetQuantity] = useState(1);
  const [bogoGetDiscountPct, setBogoGetDiscountPct] = useState(100);
  const [upsells, setUpsells] = useState<Array<{
    productId: string;
    discountType: string;
    discountValue: number;
    title: string;
    subtitle: string;
    selectedByDefault: boolean;
    matchQuantity: boolean;
  }>>([]);
  const [giftsEnabled, setGiftsEnabled] = useState(false);
  const [giftsTitle, setGiftsTitle] = useState('Free gifts with your order');
  const [giftsSubtitle, setGiftsSubtitle] = useState('');
  const [giftsLayout, setGiftsLayout] = useState<string>(editBundle?.giftsLayout ?? 'vertical');
  const [giftsHideUntilUnlocked, setGiftsHideUntilUnlocked] = useState(editBundle?.giftsHideUntilUnlocked ?? false);
  const [giftsShowLockedLabels, setGiftsShowLockedLabels] = useState(editBundle?.giftsShowLockedLabels ?? true);
  const [giftTiers, setGiftTiers] = useState<Array<{
    productId: string;
    giftType: string;
    unlockQuantity: number;
    label: string;
    lockedTitle: string;
  }>>([]);
  const [customCss, setCustomCss] = useState('');
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>({});
  const [newLocale, setNewLocale] = useState('');
  const [startsAt, setStartsAt] = useState<string>(editBundle?.startsAt ?? '');
  const [endsAt, setEndsAt] = useState<string>(editBundle?.endsAt ?? '');
  const [lowStockAlertEnabled, setLowStockAlertEnabled] = useState(editBundle?.lowStockAlertEnabled ?? false);
  const [skipToCheckout, setSkipToCheckout] = useState(editBundle?.skipToCheckout ?? false);
  const [submitting, setSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Pre-populate fields when editing
  React.useEffect(() => {
    if (editBundle && !initialized) {
      setName(editBundle.name);
      setBundleType(editBundle.type);
      setDiscountPct(editBundle.discountPct);
      setTriggerType(editBundle.triggerType);
      setDisplayRules(
        editBundle.displayRules.map((r) => ({
          targetType: r.targetType,
          targetId: r.targetId,
        })),
      );
      setSelectedItems(
        editBundle.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          isAnchor: item.isAnchor,
        })),
      );
      if (editBundle.bogoGetQuantity) setBogoGetQuantity(editBundle.bogoGetQuantity);
      if (editBundle.bogoGetDiscountPct != null) setBogoGetDiscountPct(editBundle.bogoGetDiscountPct);
      setCountdownEnabled(editBundle.countdownEnabled ?? false);
      setCountdownType(editBundle.countdownType ?? 'fixed');
      setCountdownDuration(editBundle.countdownDuration ?? 15);
      setCountdownTitle(editBundle.countdownTitle ?? 'Hurry! Offer expires in {{timer}}');
      setCountdownBgColor(editBundle.countdownBgColor ?? '#111827');
      setCountdownTextColor(editBundle.countdownTextColor ?? '#ffffff');
      setCountdownTitleFontSize(editBundle.countdownTitleFontSize ?? 14);
      setCountdownTitleFontWeight(editBundle.countdownTitleFontWeight ?? 'normal');
      setCountdownTitleAlignment(editBundle.countdownTitleAlignment ?? 'center');
      if (editBundle.upsells?.length) {
        setUpsells(editBundle.upsells.map((u) => ({
          productId: u.productId,
          discountType: u.discountType,
          discountValue: u.discountValue,
          title: u.title,
          subtitle: u.subtitle ?? '',
          selectedByDefault: u.selectedByDefault,
          matchQuantity: u.matchQuantity,
        })));
      }
      setGiftsEnabled(editBundle.giftsEnabled ?? false);
      setGiftsTitle(editBundle.giftsTitle ?? 'Free gifts with your order');
      setGiftsSubtitle(editBundle.giftsSubtitle ?? '');
      setGiftsLayout(editBundle.giftsLayout ?? 'vertical');
      setGiftsHideUntilUnlocked(editBundle.giftsHideUntilUnlocked ?? false);
      setGiftsShowLockedLabels(editBundle.giftsShowLockedLabels ?? true);
      if (editBundle.giftTiers?.length) {
        setGiftTiers(editBundle.giftTiers.map((g) => ({
          productId: g.productId ?? '',
          giftType: g.giftType,
          unlockQuantity: g.unlockQuantity,
          label: g.label ?? '',
          lockedTitle: g.lockedTitle ?? 'Locked',
        })));
      }
      if (editBundle.customCss) setCustomCss(editBundle.customCss);
      if (editBundle.translations) setTranslations(editBundle.translations);
      setStartsAt(editBundle.startsAt ?? '');
      setEndsAt(editBundle.endsAt ?? '');
      setLowStockAlertEnabled(editBundle.lowStockAlertEnabled ?? false);
      setSkipToCheckout(editBundle.skipToCheckout ?? false);
      setInitialized(true);
    }
  }, [editBundle, initialized]);

  const paymentProcessingPct = 2.9;
  const paymentProcessingFlat = 0.3;

  const marginItems = useMemo(
    () =>
      selectedItems
        .map((si) => {
          const product = products.find((p) => p.id === si.productId);
          if (!product) return null;
          return {
            price: product.price,
            cogs: product.cogs ?? 0,
            shippingCost: product.shippingCost ?? 0,
            additionalCosts: product.additionalCosts ?? 0,
            quantity: si.quantity,
          };
        })
        .filter(Boolean) as Array<{
        price: number;
        cogs: number;
        shippingCost: number;
        additionalCosts: number;
        quantity: number;
      }>,
    [selectedItems, products],
  );

  const marginResult = useMemo(() => {
    if (marginItems.length === 0) return null;
    return calculateBundleMargin({
      items: marginItems,
      bundleDiscountPct: discountPct,
      paymentProcessingPct,
      paymentProcessingFlat,
    });
  }, [marginItems, discountPct]);

  const individualTotal = marginItems.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0,
  );

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({
        name,
        type: bundleType,
        discountPct: isVolume ? volumeTiers[0]?.discountPct ?? 0 : discountPct,
        discountType: 'PERCENTAGE',
        triggerType,
        items: selectedItems.map((si) => ({
          productId: si.productId,
          quantity: si.quantity,
          isAnchor: si.isAnchor,
        })),
        displayRules: displayRules.length > 0 ? displayRules : undefined,
        volumeTiers: isVolume
          ? volumeTiers.map((t) => ({
              minQuantity: t.minQuantity,
              discountPct: t.discountPct,
              label: t.label || undefined,
            }))
          : undefined,
        bogoGetQuantity: bundleType === 'BOGO' ? bogoGetQuantity : undefined,
        bogoGetDiscountPct: bundleType === 'BOGO' ? bogoGetDiscountPct : undefined,
        countdownEnabled,
        countdownType: countdownEnabled ? countdownType : 'fixed',
        countdownDuration: countdownEnabled && countdownType === 'fixed' ? countdownDuration : undefined,
        countdownTitle: countdownEnabled ? countdownTitle : undefined,
        countdownBgColor: countdownEnabled ? countdownBgColor : '#111827',
        countdownTextColor: countdownEnabled ? countdownTextColor : '#ffffff',
        countdownTitleFontSize,
        countdownTitleFontWeight,
        countdownTitleAlignment,
        giftsEnabled,
        giftsTitle: giftsEnabled ? giftsTitle : undefined,
        giftsSubtitle: giftsEnabled && giftsSubtitle ? giftsSubtitle : undefined,
        giftsLayout,
        giftsHideUntilUnlocked,
        giftsShowLockedLabels,
        giftTiers: giftsEnabled && giftTiers.length > 0 ? giftTiers.map((g) => ({
          productId: g.productId || undefined,
          giftType: g.giftType,
          unlockQuantity: g.unlockQuantity,
          label: g.label || undefined,
          lockedTitle: g.lockedTitle || undefined,
        })) : undefined,
        upsells: upsells.length > 0 ? upsells.map((u) => ({
          productId: u.productId,
          discountType: u.discountType,
          discountValue: u.discountValue,
          title: u.title,
          subtitle: u.subtitle || undefined,
          selectedByDefault: u.selectedByDefault,
          matchQuantity: u.matchQuantity,
        })) : undefined,
        startsAt: startsAt || undefined,
        endsAt: endsAt || undefined,
        lowStockAlertEnabled,
        skipToCheckout,
        customCss: customCss || undefined,
        translations: Object.keys(translations).length > 0 ? JSON.stringify(translations) : undefined,
      });
      resetAndClose();
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setStep(0);
    setBundleType('FIXED');
    setSelectedItems([]);
    setDiscountPct(10);
    setVolumeTiers([
      { minQuantity: 2, discountPct: 10, label: '' },
      { minQuantity: 3, discountPct: 20, label: '' },
    ]);
    setTriggerType('PRODUCT_PAGE');
    setDisplayRules([]);
    setName('');
    setCountdownEnabled(false);
    setCountdownType('fixed');
    setCountdownDuration(15);
    setCountdownTitle('Hurry! Offer expires in {{timer}}');
    setCountdownBgColor('#111827');
    setCountdownTextColor('#ffffff');
    setCountdownTitleFontSize(14);
    setCountdownTitleFontWeight('normal');
    setCountdownTitleAlignment('center');
    setBogoGetQuantity(1);
    setBogoGetDiscountPct(100);
    setUpsells([]);
    setGiftsEnabled(false);
    setGiftsTitle('Free gifts with your order');
    setGiftsSubtitle('');
    setGiftsLayout('vertical');
    setGiftsHideUntilUnlocked(false);
    setGiftsShowLockedLabels(true);
    setGiftTiers([]);
    setStartsAt('');
    setEndsAt('');
    setLowStockAlertEnabled(false);
    setSkipToCheckout(false);
    setCustomCss('');
    setTranslations({});
    setNewLocale('');
    onCancel();
  };

  const isVolume = bundleType === 'VOLUME';
  const isBogo = bundleType === 'BOGO';

  const canProceed = (): boolean => {
    switch (step) {
      case 0:
        return !!bundleType;
      case 1:
        if (isVolume) return selectedItems.length >= 1;
        if (isBogo) return selectedItems.length >= 2;
        if (bundleType === 'COLLECTION' || bundleType === 'MIX_MATCH') return selectedItems.length >= 1;
        return selectedItems.length >= 2;
      case 2:
        if (isVolume) {
          return volumeTiers.length >= 2 && volumeTiers.every((t) => t.minQuantity >= 1 && t.discountPct >= 0);
        }
        if (isBogo) {
          return bogoGetQuantity >= 1 && bogoGetDiscountPct >= 0 && bogoGetDiscountPct <= 100;
        }
        return discountPct >= 0 && discountPct <= 50;
      case 3:
        return !!triggerType;
      case 4:
        return name.trim().length > 0;
      default:
        return false;
    }
  };

  const moveUpsell = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= upsells.length) return;
    const updated = [...upsells];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setUpsells(updated);
  };

  const stepLabels = [
    'Bundle Type',
    'Select Products',
    'Set Discount',
    'Display Rules',
    'Review & Create',
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'calc(100vh - 200px)',
      }}
    >

        {/* Step indicator */}
        <div
          style={{
            display: 'flex',
            padding: '12px 20px',
            gap: '4px',
            borderBottom: '1px solid #f1f1f1',
          }}
        >
          {stepLabels.map((label, i) => {
            const canClick = isEditing && i !== step;
            return (
              <div
                key={label}
                onClick={canClick ? () => setStep(i) : undefined}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: '12px',
                  color: i === step ? '#008060' : i < step ? '#1a5632' : '#6d7175',
                  fontWeight: i === step ? 600 : 400,
                  cursor: canClick ? 'pointer' : 'default',
                }}
              >
                <div
                  style={{
                    height: '3px',
                    borderRadius: '2px',
                    backgroundColor:
                      i <= step ? '#008060' : '#e1e3e5',
                    marginBottom: '4px',
                  }}
                />
                {label}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px', display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
          {/* Step 0: Bundle Type */}
          {step === 0 && (
            <div>
              <p style={{ fontSize: '14px', color: '#6d7175', marginTop: 0 }}>
                Choose the type of bundle you want to create.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {BUNDLE_TYPE_OPTIONS.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => setBundleType(opt.value)}
                    style={{
                      padding: '14px 16px',
                      border: `2px solid ${bundleType === opt.value ? '#008060' : '#e1e3e5'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor:
                        bundleType === opt.value ? '#f1f8f5' : '#ffffff',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>
                      {opt.label}
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        color: '#6d7175',
                        marginTop: '4px',
                      }}
                    >
                      {opt.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Product Picker */}
          {step === 1 && (
            <div>
              <p style={{ fontSize: '14px', color: '#6d7175', marginTop: 0 }}>
                {isVolume
                  ? 'Select one or more products. Customers will choose from these to build their volume bundle.'
                  : isBogo
                    ? 'Select at least 2 products. The last product is the "get" item.'
                    : bundleType === 'COLLECTION' || bundleType === 'MIX_MATCH'
                      ? 'Select one or more products for your bundle.'
                      : 'Select at least 2 products for your bundle.'}
              </p>
              <BundleProductPicker
                selectedItems={selectedItems}
                onItemsChange={setSelectedItems}
                products={products}
                paymentProcessingPct={paymentProcessingPct}
                paymentProcessingFlat={paymentProcessingFlat}
                discountPct={discountPct}
              />
            </div>
          )}

          {/* Step 2: Discount / Volume Tiers */}
          {step === 2 && (
            <div>
              {isVolume ? (
                <>
                  <p style={{ fontSize: '14px', color: '#6d7175', marginTop: 0 }}>
                    Define quantity tiers and their discount percentages.
                  </p>
                  {selectedItems.length > 1 && (
                    <div style={{
                      padding: '10px 12px',
                      marginBottom: '12px',
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: '#1e40af',
                    }}>
                      Volume tiers apply to total quantity across all {selectedItems.length} selected products.
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {volumeTiers.map((tier, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          gap: '8px',
                          alignItems: 'center',
                          padding: '10px 12px',
                          border: '1px solid #e1e3e5',
                          borderRadius: '6px',
                        }}
                      >
                        <div style={{ flex: '0 0 90px' }}>
                          <label style={{ fontSize: '11px', color: '#6d7175', display: 'block' }}>Qty</label>
                          <input
                            type="number"
                            min={1}
                            value={tier.minQuantity}
                            onChange={(e) => {
                              const updated = [...volumeTiers];
                              updated[idx] = { ...updated[idx], minQuantity: parseInt(e.target.value) || 1 };
                              setVolumeTiers(updated);
                            }}
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              border: '1px solid #c9cccf',
                              borderRadius: '4px',
                              fontSize: '14px',
                              boxSizing: 'border-box' as const,
                            }}
                          />
                        </div>
                        <div style={{ flex: '0 0 100px' }}>
                          <label style={{ fontSize: '11px', color: '#6d7175', display: 'block' }}>Discount %</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            value={tier.discountPct}
                            onChange={(e) => {
                              const updated = [...volumeTiers];
                              updated[idx] = { ...updated[idx], discountPct: parseFloat(e.target.value) || 0 };
                              setVolumeTiers(updated);
                            }}
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              border: '1px solid #c9cccf',
                              borderRadius: '4px',
                              fontSize: '14px',
                              boxSizing: 'border-box' as const,
                            }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '11px', color: '#6d7175', display: 'block' }}>Label (optional)</label>
                          <input
                            type="text"
                            value={tier.label}
                            onChange={(e) => {
                              const updated = [...volumeTiers];
                              updated[idx] = { ...updated[idx], label: e.target.value };
                              setVolumeTiers(updated);
                            }}
                            placeholder="e.g., Most Popular"
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              border: '1px solid #c9cccf',
                              borderRadius: '4px',
                              fontSize: '14px',
                              boxSizing: 'border-box' as const,
                            }}
                          />
                        </div>
                        {volumeTiers.length > 2 && (
                          <button
                            onClick={() => setVolumeTiers(volumeTiers.filter((_, i) => i !== idx))}
                            style={{
                              padding: '4px 8px',
                              border: '1px solid #c9cccf',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              backgroundColor: '#ffffff',
                              color: '#bf0711',
                              alignSelf: 'flex-end',
                              marginBottom: '2px',
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() =>
                        setVolumeTiers([
                          ...volumeTiers,
                          {
                            minQuantity: (volumeTiers[volumeTiers.length - 1]?.minQuantity ?? 1) + 1,
                            discountPct: (volumeTiers[volumeTiers.length - 1]?.discountPct ?? 10) + 10,
                            label: '',
                          },
                        ])
                      }
                      style={{
                        padding: '8px 14px',
                        border: '1px solid #c9cccf',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        backgroundColor: '#ffffff',
                        alignSelf: 'flex-start',
                      }}
                    >
                      + Add Tier
                    </button>
                  </div>
                </>
              ) : isBogo ? (
                <>
                  <p style={{ fontSize: '14px', color: '#6d7175', marginTop: 0 }}>
                    Configure the "Get" portion of your Buy X Get Y offer.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>
                        Get Quantity
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={bogoGetQuantity}
                        onChange={(e) => setBogoGetQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        style={{
                          width: '100px',
                          padding: '8px 12px',
                          border: '1px solid #c9cccf',
                          borderRadius: '4px',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>
                        Get Discount: {bogoGetDiscountPct}%{bogoGetDiscountPct >= 100 ? ' (FREE)' : ''}
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={bogoGetDiscountPct}
                        onChange={(e) => setBogoGetDiscountPct(parseInt(e.target.value))}
                        style={{ width: '100%' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6d7175' }}>
                        <span>0%</span>
                        <span>50%</span>
                        <span>100% (Free)</span>
                      </div>
                    </div>
                    {selectedItems.length >= 2 && (
                      <div style={{
                        padding: '12px',
                        backgroundColor: '#f1f8f5',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#1a5632',
                      }}>
                        Buy {selectedItems.slice(0, -1).map((si) => {
                          const p = products.find((pr) => pr.id === si.productId);
                          return p?.title || si.productId;
                        }).join(', ')}, get {bogoGetQuantity} x {(() => {
                          const lastItem = selectedItems[selectedItems.length - 1];
                          const p = products.find((pr) => pr.id === lastItem.productId);
                          return p?.title || lastItem.productId;
                        })()} at {bogoGetDiscountPct >= 100 ? 'FREE' : `${bogoGetDiscountPct}% off`}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '14px', color: '#6d7175', marginTop: 0 }}>
                    Set the discount percentage. The margin updates in real time.
                  </p>
                  <DiscountSlider
                    value={discountPct}
                    onChange={setDiscountPct}
                    items={marginItems}
                    paymentProcessingPct={paymentProcessingPct}
                    paymentProcessingFlat={paymentProcessingFlat}
                  />
                </>
              )}
            </div>
          )}

          {/* Step 3: Display Rules */}
          {step === 3 && (
            <div>
              <p style={{ fontSize: '14px', color: '#6d7175', marginTop: 0 }}>
                Configure where and how this bundle should be displayed.
              </p>

              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    fontSize: '14px',
                    marginBottom: '6px',
                  }}
                >
                  Trigger Type
                </label>
                <select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #c9cccf',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                >
                  {TRIGGER_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    fontSize: '14px',
                    marginBottom: '6px',
                  }}
                >
                  Show on specific pages (optional)
                </label>
                <p
                  style={{
                    fontSize: '13px',
                    color: '#6d7175',
                    marginTop: 0,
                  }}
                >
                  Pick which product or collection pages should display this
                  bundle. Leave empty to show on all pages matching the trigger.
                </p>
                {displayRules.map((rule, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <select
                      value={rule.targetType}
                      onChange={(e) => {
                        const updated = [...displayRules];
                        updated[idx] = {
                          targetType: e.target.value as 'PRODUCT' | 'COLLECTION',
                          targetId: '',
                        };
                        setDisplayRules(updated);
                      }}
                      style={{
                        padding: '6px 8px',
                        border: '1px solid #c9cccf',
                        borderRadius: '4px',
                        fontSize: '13px',
                        minWidth: '110px',
                      }}
                    >
                      <option value="PRODUCT">Product</option>
                      <option value="COLLECTION">Collection</option>
                    </select>
                    {rule.targetType === 'PRODUCT' ? (
                      <ProductSearchDropdown
                        value={rule.targetId}
                        onChange={(shopifyProductId) => {
                          const updated = [...displayRules];
                          updated[idx] = {
                            ...updated[idx],
                            targetId: shopifyProductId,
                          };
                          setDisplayRules(updated);
                        }}
                        fetch={authenticatedFetch}
                        placeholder="Search products..."
                      />
                    ) : (
                      <CollectionSearchDropdown
                        value={rule.targetId}
                        onChange={(handle) => {
                          const updated = [...displayRules];
                          updated[idx] = {
                            ...updated[idx],
                            targetId: handle,
                          };
                          setDisplayRules(updated);
                        }}
                        fetch={authenticatedFetch}
                        placeholder="Search collections..."
                      />
                    )}
                    <button
                      onClick={() =>
                        setDisplayRules(displayRules.filter((_, i) => i !== idx))
                      }
                      style={{
                        padding: '4px 10px',
                        border: '1px solid #c9cccf',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        backgroundColor: '#ffffff',
                        color: '#bf0711',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() =>
                      setDisplayRules([
                        ...displayRules,
                        { targetType: 'PRODUCT', targetId: '' },
                      ])
                    }
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #c9cccf',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    + Add Product
                  </button>
                  <button
                    onClick={() =>
                      setDisplayRules([
                        ...displayRules,
                        { targetType: 'COLLECTION', targetId: '' },
                      ])
                    }
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #c9cccf',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    + Add Collection
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label
                    style={{
                      fontWeight: 600,
                      fontSize: '14px',
                    }}
                  >
                    Bundle Name
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const suggestion = NAME_SUGGESTIONS[Math.floor(Math.random() * NAME_SUGGESTIONS.length)];
                      setName(suggestion);
                    }}
                    style={{
                      padding: '2px 8px',
                      border: '1px solid #c9cccf',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      backgroundColor: '#ffffff',
                      color: '#2c6ecb',
                    }}
                  >
                    Suggest
                  </button>
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Summer Essentials Pack"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #c9cccf',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: '#f6f6f7',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#6d7175' }}>Type</div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>
                    {
                      BUNDLE_TYPE_OPTIONS.find((o) => o.value === bundleType)
                        ?.label
                    }
                  </div>
                </div>
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: '#f6f6f7',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#6d7175' }}>
                    Products
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>
                    {selectedItems.length} items
                  </div>
                </div>
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: '#f6f6f7',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#6d7175' }}>
                    Discount
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>
                    {discountPct}%
                  </div>
                </div>
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: '#f6f6f7',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#6d7175' }}>
                    Trigger
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>
                    {
                      TRIGGER_TYPE_OPTIONS.find((o) => o.value === triggerType)
                        ?.label
                    }
                  </div>
                </div>
              </div>

              {/* Product list review */}
              <div
                style={{
                  marginBottom: '16px',
                  border: '1px solid #e1e3e5',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#f6f6f7',
                    fontWeight: 600,
                    fontSize: '13px',
                  }}
                >
                  Bundle Items
                </div>
                {selectedItems.map((si) => {
                  const product = products.find((p) => p.id === si.productId);
                  if (!product) return null;
                  return (
                    <div
                      key={si.productId}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderTop: '1px solid #f1f1f1',
                        fontSize: '13px',
                      }}
                    >
                      <span>
                        {product.title}
                        {si.isAnchor && (
                          <span
                            style={{
                              marginLeft: '6px',
                              padding: '1px 6px',
                              backgroundColor: '#e3f1df',
                              borderRadius: '4px',
                              fontSize: '11px',
                              color: '#1a5632',
                            }}
                          >
                            Anchor
                          </span>
                        )}
                      </span>
                      <span style={{ color: '#6d7175' }}>
                        {si.quantity} x ${product.price.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Scheduling */}
              <div style={{ marginBottom: '16px', border: '1px solid #e1e3e5', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '10px 12px', backgroundColor: '#f6f6f7', fontWeight: 600, fontSize: '13px' }}>
                  Scheduling
                </div>
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>Start Date</label>
                    <input
                      type="datetime-local"
                      value={startsAt}
                      onChange={(e) => setStartsAt(e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #c9cccf', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' as const }}
                    />
                    <div style={{ fontSize: '11px', color: '#6d7175', marginTop: '2px' }}>Leave empty for immediate activation</div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>End Date</label>
                    <input
                      type="datetime-local"
                      value={endsAt}
                      onChange={(e) => setEndsAt(e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #c9cccf', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' as const }}
                    />
                    <div style={{ fontSize: '11px', color: '#6d7175', marginTop: '2px' }}>Leave empty for no expiration</div>
                  </div>
                </div>
              </div>

              {/* Countdown Timer */}
              <div style={{ marginBottom: '16px', border: '1px solid #e1e3e5', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#f6f6f7', fontWeight: 600, fontSize: '13px' }}>
                  <span>Countdown Timer</span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 400, fontSize: '13px' }}>
                    <input type="checkbox" checked={countdownEnabled} onChange={(e) => setCountdownEnabled(e.target.checked)} style={{ cursor: 'pointer' }} />
                    Enable
                  </label>
                </div>
                {countdownEnabled && (
                  <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>Type</label>
                      <select value={countdownType} onChange={(e) => setCountdownType(e.target.value)} style={{ width: '100%', padding: '6px 10px', border: '1px solid #c9cccf', borderRadius: '4px', fontSize: '13px' }}>
                        <option value="fixed">Fixed duration</option>
                        <option value="midnight">Ends at midnight</option>
                        <option value="end_date">Use deal end date</option>
                      </select>
                    </div>
                    {countdownType === 'fixed' && (
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>Duration (minutes)</label>
                        <input type="number" min={1} max={1440} value={countdownDuration} onChange={(e) => setCountdownDuration(parseInt(e.target.value) || 15)} style={{ width: '100%', padding: '6px 10px', border: '1px solid #c9cccf', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' as const }} />
                      </div>
                    )}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <label style={{ fontWeight: 600, fontSize: '13px' }}>Title</label>
                        <button
                          type="button"
                          onClick={() => {
                            const suggestion = COUNTDOWN_SUGGESTIONS[Math.floor(Math.random() * COUNTDOWN_SUGGESTIONS.length)];
                            setCountdownTitle(suggestion);
                          }}
                          style={{
                            padding: '2px 8px',
                            border: '1px solid #c9cccf',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            backgroundColor: '#ffffff',
                            color: '#2c6ecb',
                          }}
                        >
                          Suggest
                        </button>
                      </div>
                      <input type="text" value={countdownTitle} onChange={(e) => setCountdownTitle(e.target.value)} maxLength={255} style={{ width: '100%', padding: '6px 10px', border: '1px solid #c9cccf', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' as const }} />
                      <div style={{ fontSize: '11px', color: '#6d7175', marginTop: '2px' }}>Use {'{{timer}}'} where the countdown should appear.</div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>Background color</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input type="color" value={countdownBgColor} onChange={(e) => setCountdownBgColor(e.target.value)} style={{ width: '32px', height: '32px', border: '1px solid #c9cccf', borderRadius: '4px', cursor: 'pointer', padding: '2px' }} />
                          <input type="text" value={countdownBgColor} onChange={(e) => setCountdownBgColor(e.target.value)} style={{ flex: 1, padding: '6px 10px', border: '1px solid #c9cccf', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' as const }} />
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>Text color</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input type="color" value={countdownTextColor} onChange={(e) => setCountdownTextColor(e.target.value)} style={{ width: '32px', height: '32px', border: '1px solid #c9cccf', borderRadius: '4px', cursor: 'pointer', padding: '2px' }} />
                          <input type="text" value={countdownTextColor} onChange={(e) => setCountdownTextColor(e.target.value)} style={{ flex: 1, padding: '6px 10px', border: '1px solid #c9cccf', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' as const }} />
                        </div>
                      </div>
                    </div>
                    {/* Font Size */}
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>Font Size: {countdownTitleFontSize}px</label>
                      <input
                        type="range"
                        min={8}
                        max={32}
                        step={1}
                        value={countdownTitleFontSize}
                        onChange={(e) => setCountdownTitleFontSize(parseInt(e.target.value))}
                        style={{ width: '100%' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6d7175' }}>
                        <span>8px</span>
                        <span>32px</span>
                      </div>
                    </div>
                    {/* Font Weight */}
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>Font Weight</label>
                      <select
                        value={countdownTitleFontWeight}
                        onChange={(e) => setCountdownTitleFontWeight(e.target.value)}
                        style={{ width: '100%', padding: '6px 10px', border: '1px solid #c9cccf', borderRadius: '4px', fontSize: '13px' }}
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                      </select>
                    </div>
                    {/* Text Alignment */}
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>Text Alignment</label>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {(['left', 'center', 'right'] as const).map((align) => (
                          <button
                            key={align}
                            type="button"
                            onClick={() => setCountdownTitleAlignment(align)}
                            style={{
                              flex: 1,
                              padding: '6px 10px',
                              border: countdownTitleAlignment === align ? '2px solid #008060' : '1px solid #c9cccf',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              backgroundColor: countdownTitleAlignment === align ? '#f1f8f5' : '#ffffff',
                              fontWeight: countdownTitleAlignment === align ? 600 : 400,
                              textTransform: 'capitalize' as const,
                            }}
                          >
                            {align}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: countdownTitleAlignment as 'left' | 'center' | 'right', padding: '10px 16px', borderRadius: '8px', backgroundColor: countdownBgColor, color: countdownTextColor, fontSize: `${countdownTitleFontSize}px`, fontWeight: countdownTitleFontWeight === 'bold' ? 700 : 400, textAlign: countdownTitleAlignment as 'left' | 'center' | 'right' }}>
                      {countdownTitle.replace('{{timer}}', '14:59')}
                    </div>
                  </div>
                )}
              </div>

              {/* Checkout Upsells */}
              <div style={{ marginBottom: '16px', border: '1px solid #e1e3e5', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#f6f6f7', fontWeight: 600, fontSize: '13px' }}>
                  <span>Checkout Upsells</span>
                  <button
                    onClick={() => setUpsells([...upsells, {
                      productId: '',
                      discountType: 'PERCENTAGE',
                      discountValue: 0,
                      title: '{{product}}',
                      subtitle: '',
                      selectedByDefault: false,
                      matchQuantity: false,
                    }])}
                    style={{
                      padding: '4px 10px',
                      border: '1px solid #c9cccf',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    + Add Upsell
                  </button>
                </div>
                {upsells.length === 0 && (
                  <div style={{ padding: '12px', fontSize: '13px', color: '#6d7175' }}>
                    No upsells configured. Add checkbox add-ons that appear below the bundle widget.
                  </div>
                )}
                {upsells.map((upsell, idx) => (
                  <div key={idx} style={{ padding: '12px', borderTop: '1px solid #f1f1f1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => moveUpsell(idx, 'up')}
                          disabled={idx === 0}
                          style={{
                            padding: '2px 6px',
                            border: '1px solid #c9cccf',
                            borderRadius: '3px',
                            cursor: idx === 0 ? 'not-allowed' : 'pointer',
                            fontSize: '11px',
                            backgroundColor: '#ffffff',
                            color: idx === 0 ? '#c9cccf' : '#202223',
                            lineHeight: 1,
                          }}
                        >
                          &#9650;
                        </button>
                        <button
                          type="button"
                          onClick={() => moveUpsell(idx, 'down')}
                          disabled={idx === upsells.length - 1}
                          style={{
                            padding: '2px 6px',
                            border: '1px solid #c9cccf',
                            borderRadius: '3px',
                            cursor: idx === upsells.length - 1 ? 'not-allowed' : 'pointer',
                            fontSize: '11px',
                            backgroundColor: '#ffffff',
                            color: idx === upsells.length - 1 ? '#c9cccf' : '#202223',
                            lineHeight: 1,
                          }}
                        >
                          &#9660;
                        </button>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '11px', color: '#6d7175', display: 'block' }}>Product ID</label>
                        <input
                          type="text"
                          value={upsell.productId}
                          onChange={(e) => {
                            const updated = [...upsells];
                            updated[idx] = { ...updated[idx], productId: e.target.value };
                            setUpsells(updated);
                          }}
                          placeholder="Product ID"
                          style={{ width: '100%', padding: '6px 8px', border: '1px solid #c9cccf', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' as const }}
                        />
                      </div>
                      <div style={{ flex: '0 0 140px' }}>
                        <label style={{ fontSize: '11px', color: '#6d7175', display: 'block' }}>Discount Type</label>
                        <select
                          value={upsell.discountType}
                          onChange={(e) => {
                            const updated = [...upsells];
                            updated[idx] = { ...updated[idx], discountType: e.target.value };
                            setUpsells(updated);
                          }}
                          style={{ width: '100%', padding: '6px 8px', border: '1px solid #c9cccf', borderRadius: '4px', fontSize: '13px' }}
                        >
                          <option value="PERCENTAGE">Percentage off</option>
                          <option value="FIXED_AMOUNT">Fixed amount</option>
                          <option value="FREE">Free</option>
                        </select>
                      </div>
                      {upsell.discountType !== 'FREE' && (
                        <div style={{ flex: '0 0 90px' }}>
                          <label style={{ fontSize: '11px', color: '#6d7175', display: 'block' }}>Discount</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            value={upsell.discountValue}
                            onChange={(e) => {
                              const updated = [...upsells];
                              updated[idx] = { ...updated[idx], discountValue: parseFloat(e.target.value) || 0 };
                              setUpsells(updated);
                            }}
                            style={{ width: '100%', padding: '6px 8px', border: '1px solid #c9cccf', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' as const }}
                          />
                        </div>
                      )}
                      <button
                        onClick={() => setUpsells(upsells.filter((_, i) => i !== idx))}
                        style={{
                          padding: '4px 8px',
                          border: '1px solid #c9cccf',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          backgroundColor: '#ffffff',
                          color: '#bf0711',
                          alignSelf: 'flex-end',
                          marginBottom: '2px',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '11px', color: '#6d7175', display: 'block' }}>Title</label>
                        <input
                          type="text"
                          value={upsell.title}
                          onChange={(e) => {
                            const updated = [...upsells];
                            updated[idx] = { ...updated[idx], title: e.target.value };
                            setUpsells(updated);
                          }}
                          maxLength={255}
                          style={{ width: '100%', padding: '6px 8px', border: '1px solid #c9cccf', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' as const }}
                        />
                        <div style={{ fontSize: '10px', color: '#8c9196', marginTop: '2px' }}>{'Use {{product}} for product name'}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '11px', color: '#6d7175', display: 'block' }}>Subtitle (optional)</label>
                        <input
                          type="text"
                          value={upsell.subtitle}
                          onChange={(e) => {
                            const updated = [...upsells];
                            updated[idx] = { ...updated[idx], subtitle: e.target.value };
                            setUpsells(updated);
                          }}
                          maxLength={255}
                          placeholder="e.g., Save {{saved_amount}}"
                          style={{ width: '100%', padding: '6px 8px', border: '1px solid #c9cccf', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' as const }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={upsell.selectedByDefault}
                          onChange={(e) => {
                            const updated = [...upsells];
                            updated[idx] = { ...updated[idx], selectedByDefault: e.target.checked };
                            setUpsells(updated);
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                        Selected by default
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={upsell.matchQuantity}
                          onChange={(e) => {
                            const updated = [...upsells];
                            updated[idx] = { ...updated[idx], matchQuantity: e.target.checked };
                            setUpsells(updated);
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                        Match quantity
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              {/* Progressive Gifts */}
              <div style={{ marginBottom: '16px', border: '1px solid #e1e3e5', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#f6f6f7', fontWeight: 600, fontSize: '13px' }}>
                  <span>Progressive Gifts</span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 400, fontSize: '13px' }}>
                    <input type="checkbox" checked={giftsEnabled} onChange={(e) => setGiftsEnabled(e.target.checked)} style={{ cursor: 'pointer' }} />
                    Enable
                  </label>
                </div>
                {giftsEnabled && (
                  <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>Title</label>
                      <input type="text" value={giftsTitle} onChange={(e) => setGiftsTitle(e.target.value)} maxLength={255} style={{ width: '100%', padding: '6px 10px', border: '1px solid #c9cccf', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' as const }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>Subtitle (optional)</label>
                      <input type="text" value={giftsSubtitle} onChange={(e) => setGiftsSubtitle(e.target.value)} maxLength={255} style={{ width: '100%', padding: '6px 10px', border: '1px solid #c9cccf', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' as const }} />
                    </div>
                    {/* Gifts Layout */}
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>Layout</label>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {([
                          { value: 'vertical', label: 'Vertical' },
                          { value: 'horizontal', label: 'Horizontal' },
                        ] as const).map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setGiftsLayout(opt.value)}
                            style={{
                              flex: 1,
                              padding: '8px 10px',
                              border: giftsLayout === opt.value ? '2px solid #008060' : '1px solid #c9cccf',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              backgroundColor: giftsLayout === opt.value ? '#f1f8f5' : '#ffffff',
                              fontWeight: giftsLayout === opt.value ? 600 : 400,
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Hide gifts until unlocked */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                      <input
                        type="checkbox"
                        checked={giftsHideUntilUnlocked}
                        onChange={(e) => setGiftsHideUntilUnlocked(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      Hide gifts until unlocked
                    </label>
                    {/* Show labels for locked gifts */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                      <input
                        type="checkbox"
                        checked={giftsShowLockedLabels}
                        onChange={(e) => setGiftsShowLockedLabels(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      Show labels for locked gifts
                    </label>
                    {giftTiers.map((gift, idx) => (
                      <div key={idx} style={{ padding: '10px', border: '1px solid #e1e3e5', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <div style={{ flex: '0 0 140px' }}>
                            <label style={{ fontSize: '11px', color: '#6d7175', display: 'block' }}>Gift Type</label>
                            <select
                              value={gift.giftType}
                              onChange={(e) => {
                                const updated = [...giftTiers];
                                updated[idx] = { ...updated[idx], giftType: e.target.value };
                                setGiftTiers(updated);
                              }}
                              style={{ width: '100%', padding: '6px 8px', border: '1px solid #c9cccf', borderRadius: '4px', fontSize: '13px' }}
                            >
                              <option value="FREE_GIFT">Free Gift</option>
                              <option value="FREE_SHIPPING">Free Shipping</option>
                            </select>
                          </div>
                          <div style={{ flex: '0 0 100px' }}>
                            <label style={{ fontSize: '11px', color: '#6d7175', display: 'block' }}>Unlock at qty</label>
                            <input
                              type="number"
                              min={1}
                              value={gift.unlockQuantity}
                              onChange={(e) => {
                                const updated = [...giftTiers];
                                updated[idx] = { ...updated[idx], unlockQuantity: parseInt(e.target.value) || 1 };
                                setGiftTiers(updated);
                              }}
                              style={{ width: '100%', padding: '6px 8px', border: '1px solid #c9cccf', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' as const }}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '11px', color: '#6d7175', display: 'block' }}>Label</label>
                            <input
                              type="text"
                              value={gift.label}
                              onChange={(e) => {
                                const updated = [...giftTiers];
                                updated[idx] = { ...updated[idx], label: e.target.value };
                                setGiftTiers(updated);
                              }}
                              placeholder="e.g., Free Tote Bag"
                              maxLength={255}
                              style={{ width: '100%', padding: '6px 8px', border: '1px solid #c9cccf', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' as const }}
                            />
                          </div>
                          <button
                            onClick={() => setGiftTiers(giftTiers.filter((_, i) => i !== idx))}
                            style={{
                              padding: '4px 8px',
                              border: '1px solid #c9cccf',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              backgroundColor: '#ffffff',
                              color: '#bf0711',
                              alignSelf: 'flex-end',
                              marginBottom: '2px',
                            }}
                          >
                            Remove
                          </button>
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#6d7175', display: 'block' }}>Locked Title</label>
                          <input
                            type="text"
                            value={gift.lockedTitle}
                            onChange={(e) => {
                              const updated = [...giftTiers];
                              updated[idx] = { ...updated[idx], lockedTitle: e.target.value };
                              setGiftTiers(updated);
                            }}
                            placeholder="e.g., Buy 3+ to unlock"
                            maxLength={255}
                            style={{ width: '100%', padding: '6px 8px', border: '1px solid #c9cccf', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' as const }}
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => setGiftTiers([...giftTiers, {
                        productId: '',
                        giftType: 'FREE_GIFT',
                        unlockQuantity: giftTiers.length + 1,
                        label: '',
                        lockedTitle: 'Locked',
                      }])}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid #c9cccf',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        backgroundColor: '#ffffff',
                        alignSelf: 'flex-start',
                      }}
                    >
                      + Add Gift
                    </button>
                  </div>
                )}
              </div>

              {/* Low Stock Alert */}
              <div style={{ marginBottom: '16px', border: '1px solid #e1e3e5', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#f6f6f7', fontWeight: 600, fontSize: '13px' }}>
                  <span>Low Stock Alert</span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 400, fontSize: '13px' }}>
                    <input type="checkbox" checked={lowStockAlertEnabled} onChange={(e) => setLowStockAlertEnabled(e.target.checked)} style={{ cursor: 'pointer' }} />
                    Enable
                  </label>
                </div>
                <div style={{ padding: '12px', fontSize: '13px', color: '#6d7175' }}>
                  Show urgency indicator when product stock is low
                </div>
              </div>

              {/* Skip to Checkout */}
              <div style={{ marginBottom: '16px', border: '1px solid #e1e3e5', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#f6f6f7', fontWeight: 600, fontSize: '13px' }}>
                  <span>Skip Cart</span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 400, fontSize: '13px' }}>
                    <input type="checkbox" checked={skipToCheckout} onChange={(e) => setSkipToCheckout(e.target.checked)} style={{ cursor: 'pointer' }} />
                    Enable
                  </label>
                </div>
                <div style={{ padding: '12px', fontSize: '13px', color: '#6d7175' }}>
                  Skip cart and go directly to checkout
                </div>
              </div>

              {/* Custom CSS */}
              <div style={{ marginBottom: '16px', border: '1px solid #e1e3e5', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '10px 12px', backgroundColor: '#f6f6f7', fontWeight: 600, fontSize: '13px' }}>
                  Custom CSS
                </div>
                <div style={{ padding: '12px' }}>
                  <textarea
                    value={customCss}
                    onChange={(e) => setCustomCss(e.target.value)}
                    rows={8}
                    maxLength={10000}
                    placeholder={`.bundlify-card { border-radius: 16px; }`}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1px solid #c9cccf',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontFamily: 'monospace',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ fontSize: '11px', color: '#6d7175', marginTop: '4px' }}>
                    CSS rules applied only to this deal. Scoped via a per-deal style tag on the storefront.
                  </div>
                </div>
              </div>

              {/* Translations */}
              <div style={{ marginBottom: '16px', border: '1px solid #e1e3e5', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '10px 12px', backgroundColor: '#f6f6f7', fontWeight: 600, fontSize: '13px' }}>
                  Translations
                </div>
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '13px', color: '#6d7175' }}>
                    Add translations for customer-facing text in different languages.
                  </div>
                  {Object.keys(translations).map((locale) => (
                    <div key={locale} style={{ padding: '10px', border: '1px solid #e1e3e5', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '13px', textTransform: 'uppercase' }}>{locale}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = { ...translations };
                            delete updated[locale];
                            setTranslations(updated);
                          }}
                          style={{
                            padding: '2px 8px',
                            border: '1px solid #c9cccf',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            backgroundColor: '#ffffff',
                            color: '#bf0711',
                          }}
                        >
                          Remove
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: '#6d7175', display: 'block' }}>Name</label>
                          <input
                            type="text"
                            value={translations[locale]?.name || ''}
                            onChange={(e) => {
                              setTranslations({
                                ...translations,
                                [locale]: { ...translations[locale], name: e.target.value },
                              });
                            }}
                            placeholder={name || 'Bundle name'}
                            style={{ width: '100%', padding: '6px 8px', border: '1px solid #c9cccf', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' as const }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#6d7175', display: 'block' }}>Button Text</label>
                          <input
                            type="text"
                            value={translations[locale]?.buttonText || ''}
                            onChange={(e) => {
                              setTranslations({
                                ...translations,
                                [locale]: { ...translations[locale], buttonText: e.target.value },
                              });
                            }}
                            placeholder="Add Bundle to Cart"
                            style={{ width: '100%', padding: '6px 8px', border: '1px solid #c9cccf', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' as const }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#6d7175', display: 'block' }}>Countdown Title</label>
                          <input
                            type="text"
                            value={translations[locale]?.countdownTitle || ''}
                            onChange={(e) => {
                              setTranslations({
                                ...translations,
                                [locale]: { ...translations[locale], countdownTitle: e.target.value },
                              });
                            }}
                            placeholder={countdownTitle}
                            style={{ width: '100%', padding: '6px 8px', border: '1px solid #c9cccf', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' as const }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={newLocale}
                      onChange={(e) => setNewLocale(e.target.value.toLowerCase().slice(0, 5))}
                      placeholder="e.g., fr, de, es"
                      maxLength={5}
                      style={{
                        width: '100px',
                        padding: '6px 8px',
                        border: '1px solid #c9cccf',
                        borderRadius: '4px',
                        fontSize: '13px',
                        boxSizing: 'border-box' as const,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const code = newLocale.trim();
                        if (code && !translations[code]) {
                          setTranslations({ ...translations, [code]: {} });
                          setNewLocale('');
                        }
                      }}
                      disabled={!newLocale.trim() || !!translations[newLocale.trim()]}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid #c9cccf',
                        borderRadius: '4px',
                        cursor: newLocale.trim() && !translations[newLocale.trim()] ? 'pointer' : 'not-allowed',
                        fontSize: '12px',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      + Add Language
                    </button>
                  </div>
                </div>
              </div>

              {marginResult && (
                <MarginImpactCard
                  bundlePrice={marginResult.effectivePrice}
                  individualTotal={individualTotal}
                  discountPct={discountPct}
                  contributionMargin={marginResult.contributionMargin}
                  contributionMarginPct={marginResult.contributionMarginPct}
                  isProfitable={marginResult.isProfitable}
                />
              )}
            </div>
          )}
          </div>

          {/* Live Preview Panel */}
          <div style={{ width: '380px', flexShrink: 0 }}>
            <BundlePreview
              bundleType={bundleType}
              name={name}
              items={selectedItems.map((si) => {
                const product = products.find((p) => p.id === si.productId);
                return {
                  productId: si.productId,
                  title: product?.title || si.productId,
                  price: product?.price || 0,
                  imageUrl: product?.imageUrl,
                  quantity: si.quantity,
                };
              })}
              discountPct={discountPct}
              volumeTiers={volumeTiers}
              bogoGetQuantity={bogoGetQuantity}
              bogoGetDiscountPct={bogoGetDiscountPct}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderTop: '1px solid #e1e3e5',
          }}
        >
          <button
            onClick={step === 0 ? resetAndClose : () => setStep(step - 1)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ffffff',
              border: '1px solid #c9cccf',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {step === 0 ? 'Cancel' : 'Back'}
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              style={{
                padding: '8px 20px',
                backgroundColor: canProceed() ? '#008060' : '#e4e5e7',
                color: canProceed() ? '#ffffff' : '#6d7175',
                border: 'none',
                borderRadius: '4px',
                cursor: canProceed() ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || submitting}
              style={{
                padding: '8px 20px',
                backgroundColor:
                  canProceed() && !submitting ? '#008060' : '#e4e5e7',
                color: canProceed() && !submitting ? '#ffffff' : '#6d7175',
                border: 'none',
                borderRadius: '4px',
                cursor:
                  canProceed() && !submitting ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Bundle'}
            </button>
          )}
        </div>
    </div>
  );
}
