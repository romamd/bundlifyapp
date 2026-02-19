import React, { useState, useMemo } from 'react';
import type { ProductDto, CreateBundleDto, BundleDto } from '@bundlify/shared-types';
import { calculateBundleMargin } from '@bundlify/margin-engine';
import {
  BundleProductPicker,
  type SelectedBundleItem,
} from './BundleProductPicker';
import { DiscountSlider } from './DiscountSlider';
import { MarginImpactCard } from './MarginImpactCard';

interface BundleWizardProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBundleDto) => Promise<void>;
  products: ProductDto[];
  editBundle?: BundleDto | null;
}

const BUNDLE_TYPE_OPTIONS = [
  {
    value: 'FIXED',
    label: 'Fixed Bundle',
    description:
      'A curated set of products sold together at a discount. Customer buys all items in the bundle.',
  },
  {
    value: 'CROSS_SELL',
    label: 'Cross-Sell',
    description:
      'Recommend complementary products. Shows when the anchor product is added to cart.',
  },
  {
    value: 'DEAD_STOCK',
    label: 'Dead Stock Clearance',
    description:
      'Pair slow-moving inventory with popular products to clear dead stock profitably.',
  },
] as const;

const TRIGGER_TYPE_OPTIONS = [
  { value: 'PRODUCT_PAGE', label: 'Product Page' },
  { value: 'CART_PAGE', label: 'Cart Page' },
  { value: 'CHECKOUT', label: 'Checkout Upsell' },
  { value: 'EXIT_INTENT', label: 'Exit Intent Popup' },
] as const;

export function BundleWizard({
  open,
  onClose,
  onSubmit,
  products,
  editBundle,
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
  const [submitting, setSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Pre-populate fields when editing
  React.useEffect(() => {
    if (open && editBundle && !initialized) {
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
      setInitialized(true);
    }
    if (!open) {
      setInitialized(false);
    }
  }, [open, editBundle, initialized]);

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
        discountPct,
        discountType: 'PERCENTAGE',
        triggerType,
        items: selectedItems.map((si) => ({
          productId: si.productId,
          quantity: si.quantity,
          isAnchor: si.isAnchor,
        })),
        displayRules: displayRules.length > 0 ? displayRules : undefined,
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
    setTriggerType('PRODUCT_PAGE');
    setDisplayRules([]);
    setName('');
    onClose();
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 0:
        return !!bundleType;
      case 1:
        return selectedItems.length >= 2;
      case 2:
        return discountPct >= 0 && discountPct <= 50;
      case 3:
        return !!triggerType;
      case 4:
        return name.trim().length > 0;
      default:
        return false;
    }
  };

  if (!open) return null;

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
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          width: '680px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid #e1e3e5',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '18px' }}>{isEditing ? 'Edit Bundle' : 'Create Bundle'}</h2>
          <button
            onClick={resetAndClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#6d7175',
              padding: '4px',
            }}
          >
            x
          </button>
        </div>

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
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
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
                Select at least 2 products for your bundle.
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

          {/* Step 2: Discount */}
          {step === 2 && (
            <div>
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
                  Display Rules (optional)
                </label>
                <p
                  style={{
                    fontSize: '13px',
                    color: '#6d7175',
                    marginTop: 0,
                  }}
                >
                  Add product or collection targets to control where the bundle
                  appears. Leave empty to show on all pages matching the trigger
                  type.
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
                          ...updated[idx],
                          targetType: e.target.value as 'PRODUCT' | 'COLLECTION',
                        };
                        setDisplayRules(updated);
                      }}
                      style={{
                        padding: '6px 8px',
                        border: '1px solid #c9cccf',
                        borderRadius: '4px',
                        fontSize: '13px',
                      }}
                    >
                      <option value="PRODUCT">Product</option>
                      <option value="COLLECTION">Collection</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Target ID"
                      value={rule.targetId}
                      onChange={(e) => {
                        const updated = [...displayRules];
                        updated[idx] = {
                          ...updated[idx],
                          targetId: e.target.value,
                        };
                        setDisplayRules(updated);
                      }}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        border: '1px solid #c9cccf',
                        borderRadius: '4px',
                        fontSize: '13px',
                      }}
                    />
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
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
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
                  + Add Rule
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    fontSize: '14px',
                    marginBottom: '6px',
                  }}
                >
                  Bundle Name
                </label>
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
    </div>
  );
}
