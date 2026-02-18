import React, { useState, useMemo } from 'react';
import type { ProductDto } from '@bundlify/shared-types';
import { calculateBundleMargin } from '@bundlify/margin-engine';

export interface SelectedBundleItem {
  productId: string;
  quantity: number;
  isAnchor: boolean;
}

interface BundleProductPickerProps {
  selectedItems: SelectedBundleItem[];
  onItemsChange: (items: SelectedBundleItem[]) => void;
  products: ProductDto[];
  paymentProcessingPct?: number;
  paymentProcessingFlat?: number;
  discountPct?: number;
}

type SortOption = 'title' | 'price-asc' | 'price-desc' | 'margin-desc' | 'margin-asc';

const FILTER_CHIP_STYLE = (active: boolean): React.CSSProperties => ({
  padding: '4px 10px',
  fontSize: '12px',
  fontWeight: 500,
  border: `1px solid ${active ? '#008060' : '#c9cccf'}`,
  borderRadius: '16px',
  backgroundColor: active ? '#e3f1df' : '#ffffff',
  color: active ? '#1a5632' : '#6d7175',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
});

export function BundleProductPicker({
  selectedItems,
  onItemsChange,
  products,
  paymentProcessingPct = 2.9,
  paymentProcessingFlat = 0.3,
  discountPct = 0,
}: BundleProductPickerProps) {
  const [search, setSearch] = useState('');
  const [deadStockOnly, setDeadStockOnly] = useState(false);
  const [hasCogs, setHasCogs] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('title');

  const filteredProducts = useMemo(() => {
    let result = products;

    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(lower) ||
          (p.sku && p.sku.toLowerCase().includes(lower)),
      );
    }

    if (deadStockOnly) {
      result = result.filter((p) => p.isDeadStock);
    }
    if (hasCogs) {
      result = result.filter((p) => p.cogs !== null && p.cogs > 0);
    }
    if (inStockOnly) {
      result = result.filter((p) => p.inventoryQuantity > 0);
    }

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'margin-desc':
          return (b.contributionMarginPct ?? -1) - (a.contributionMarginPct ?? -1);
        case 'margin-asc':
          return (a.contributionMarginPct ?? 999) - (b.contributionMarginPct ?? 999);
        default:
          return a.title.localeCompare(b.title);
      }
    });

    return result;
  }, [products, search, deadStockOnly, hasCogs, inStockOnly, sortBy]);

  const selectedIds = new Set(selectedItems.map((i) => i.productId));

  const marginPreview = useMemo(() => {
    if (selectedItems.length === 0) return null;
    const items = selectedItems
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
    }>;

    if (items.length === 0) return null;

    return calculateBundleMargin({
      items,
      bundleDiscountPct: discountPct,
      paymentProcessingPct,
      paymentProcessingFlat,
    });
  }, [
    selectedItems,
    products,
    discountPct,
    paymentProcessingPct,
    paymentProcessingFlat,
  ]);

  const toggleProduct = (productId: string) => {
    if (selectedIds.has(productId)) {
      onItemsChange(selectedItems.filter((i) => i.productId !== productId));
    } else {
      onItemsChange([
        ...selectedItems,
        { productId, quantity: 1, isAnchor: false },
      ]);
    }
  };

  const updateItem = (
    productId: string,
    updates: Partial<SelectedBundleItem>,
  ) => {
    onItemsChange(
      selectedItems.map((i) =>
        i.productId === productId ? { ...i, ...updates } : i,
      ),
    );
  };

  const individualTotal = selectedItems.reduce((sum, si) => {
    const product = products.find((p) => p.id === si.productId);
    return sum + (product ? product.price * si.quantity : 0);
  }, 0);

  const marginColor =
    marginPreview === null
      ? '#6d7175'
      : marginPreview.isProfitable
        ? '#1a5632'
        : '#8c1a1a';

  return (
    <div>
      <input
        type="text"
        placeholder="Search products by title or SKU..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #c9cccf',
          borderRadius: '4px',
          fontSize: '14px',
          marginBottom: '8px',
          boxSizing: 'border-box',
        }}
      />

      {/* Filters row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '12px',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => setDeadStockOnly(!deadStockOnly)}
          style={FILTER_CHIP_STYLE(deadStockOnly)}
        >
          Dead Stock
        </button>
        <button
          type="button"
          onClick={() => setHasCogs(!hasCogs)}
          style={FILTER_CHIP_STYLE(hasCogs)}
        >
          Has COGS
        </button>
        <button
          type="button"
          onClick={() => setInStockOnly(!inStockOnly)}
          style={FILTER_CHIP_STYLE(inStockOnly)}
        >
          In Stock
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '12px', color: '#6d7175' }}>Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            style={{
              padding: '4px 6px',
              border: '1px solid #c9cccf',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#202223',
              backgroundColor: '#ffffff',
            }}
          >
            <option value="title">Name</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="margin-desc">Margin: High to Low</option>
            <option value="margin-asc">Margin: Low to High</option>
          </select>
        </div>

        <span style={{ fontSize: '11px', color: '#6d7175' }}>
          {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Selected items summary */}
      {selectedItems.length > 0 && (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#f1f8f5',
            borderRadius: '8px',
            marginBottom: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <strong style={{ fontSize: '14px' }}>
              {selectedItems.length} product{selectedItems.length !== 1 ? 's' : ''}{' '}
              selected
            </strong>
            <span style={{ fontSize: '13px', color: '#6d7175' }}>
              Total: ${individualTotal.toFixed(2)}
            </span>
          </div>

          {selectedItems.map((si) => {
            const product = products.find((p) => p.id === si.productId);
            if (!product) return null;
            return (
              <div
                key={si.productId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 0',
                  borderTop: '1px solid #e1e3e5',
                  fontSize: '13px',
                }}
              >
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    style={{
                      width: '32px',
                      height: '32px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                    }}
                  />
                )}
                <span style={{ flex: 1 }}>
                  {product.title}
                  {product.variantTitle ? ` - ${product.variantTitle}` : ''}
                </span>
                <span style={{ color: '#6d7175' }}>${product.price.toFixed(2)}</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Qty:
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={si.quantity}
                    onChange={(e) =>
                      updateItem(si.productId, {
                        quantity: Math.max(1, parseInt(e.target.value, 10) || 1),
                      })
                    }
                    style={{
                      width: '50px',
                      padding: '4px',
                      border: '1px solid #c9cccf',
                      borderRadius: '4px',
                      fontSize: '13px',
                    }}
                  />
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={si.isAnchor}
                    onChange={(e) =>
                      updateItem(si.productId, { isAnchor: e.target.checked })
                    }
                  />
                  Anchor
                </label>
                <button
                  onClick={() => toggleProduct(si.productId)}
                  style={{
                    padding: '2px 8px',
                    backgroundColor: '#ffd2d2',
                    color: '#8c1a1a',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Remove
                </button>
              </div>
            );
          })}

          {marginPreview && (
            <div
              style={{
                marginTop: '8px',
                paddingTop: '8px',
                borderTop: '1px solid #e1e3e5',
                fontSize: '13px',
              }}
            >
              <span style={{ color: '#6d7175' }}>Estimated Margin: </span>
              <strong style={{ color: marginColor }}>
                ${marginPreview.contributionMargin.toFixed(2)} (
                {marginPreview.contributionMarginPct.toFixed(1)}%)
              </strong>
            </div>
          )}
        </div>
      )}

      {/* Product list */}
      <div
        style={{
          maxHeight: '300px',
          overflowY: 'auto',
          border: '1px solid #e1e3e5',
          borderRadius: '8px',
        }}
      >
        {filteredProducts.length === 0 ? (
          <div
            style={{
              padding: '20px',
              textAlign: 'center',
              color: '#6d7175',
              fontSize: '14px',
            }}
          >
            No products found
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => toggleProduct(product.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                cursor: 'pointer',
                borderBottom: '1px solid #f1f1f1',
                backgroundColor: selectedIds.has(product.id)
                  ? '#f1f8f5'
                  : '#ffffff',
              }}
            >
              <input
                type="checkbox"
                checked={selectedIds.has(product.id)}
                onChange={() => toggleProduct(product.id)}
                style={{ flexShrink: 0 }}
              />
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  style={{
                    width: '36px',
                    height: '36px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                    flexShrink: 0,
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '14px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {product.title}
                  {product.variantTitle ? ` - ${product.variantTitle}` : ''}
                </div>
                <div style={{ fontSize: '12px', color: '#6d7175' }}>
                  {product.sku ? `SKU: ${product.sku}` : 'No SKU'}
                  {product.cogs !== null
                    ? ` | COGS: $${product.cogs.toFixed(2)}`
                    : ' | No COGS'}
                  {product.isDeadStock && (
                    <span style={{ color: '#8c1a1a', marginLeft: '4px' }}>
                      Dead Stock
                    </span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>
                  ${product.price.toFixed(2)}
                </div>
                {product.contributionMarginPct !== null && (
                  <div
                    style={{
                      fontSize: '12px',
                      color:
                        product.contributionMarginPct >= 30
                          ? '#1a5632'
                          : product.contributionMarginPct >= 15
                            ? '#6a5c00'
                            : '#8c1a1a',
                    }}
                  >
                    {product.contributionMarginPct.toFixed(1)}% margin
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
