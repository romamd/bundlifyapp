import React, { useState } from 'react';
import type { ProductDto } from '@bundlify/shared-types';
import { MarginBadge } from './MarginBadge';
import { CogsInlineEdit } from './CogsInlineEdit';

interface ProductTableProps {
  products: ProductDto[];
  onUpdateCogs: (
    productId: string,
    data: { cogs?: number; shippingCost?: number; additionalCosts?: number },
  ) => Promise<void>;
}

export function ProductTable({ products, onUpdateCogs }: ProductTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: '2px solid #e1e3e5', textAlign: 'left' }}>
          <th style={{ padding: '8px 12px', fontSize: '13px', fontWeight: 600 }}>Product</th>
          <th style={{ padding: '8px 12px', fontSize: '13px', fontWeight: 600, textAlign: 'right' }}>Price</th>
          <th style={{ padding: '8px 12px', fontSize: '13px', fontWeight: 600, textAlign: 'right' }}>COGS</th>
          <th style={{ padding: '8px 12px', fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>Margin</th>
          <th style={{ padding: '8px 12px', fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>Status</th>
          <th style={{ padding: '8px 12px', fontSize: '13px', fontWeight: 600 }}></th>
        </tr>
      </thead>
      <tbody>
        {products.map((product) => (
          <React.Fragment key={product.id}>
            <tr style={{ borderBottom: '1px solid #f1f2f3' }}>
              <td style={{ padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl}
                      alt=""
                      style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }}
                    />
                  )}
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '14px' }}>{product.title}</div>
                    {product.variantTitle && (
                      <div style={{ fontSize: '12px', color: '#6d7175' }}>{product.variantTitle}</div>
                    )}
                    {product.sku && (
                      <div style={{ fontSize: '11px', color: '#8c9196' }}>SKU: {product.sku}</div>
                    )}
                  </div>
                </div>
              </td>
              <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '14px' }}>
                ${product.price.toFixed(2)}
              </td>
              <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '14px' }}>
                {product.cogs !== null ? `$${product.cogs.toFixed(2)}` : '-'}
              </td>
              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                <MarginBadge marginPct={product.contributionMarginPct} />
              </td>
              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                {product.isDeadStock && (
                  <span style={{
                    padding: '2px 6px',
                    backgroundColor: '#ffd2d2',
                    color: '#8c1a1a',
                    borderRadius: '4px',
                    fontSize: '11px',
                  }}>
                    Dead Stock ({product.daysWithoutSale}d)
                  </span>
                )}
              </td>
              <td style={{ padding: '10px 12px' }}>
                <button
                  onClick={() => setEditingId(editingId === product.id ? null : product.id)}
                  style={{
                    padding: '4px 12px',
                    fontSize: '13px',
                    backgroundColor: 'white',
                    border: '1px solid #c9cccf',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  {editingId === product.id ? 'Close' : 'Edit COGS'}
                </button>
              </td>
            </tr>
            {editingId === product.id && (
              <tr>
                <td colSpan={6} style={{ padding: '0 12px 12px 12px' }}>
                  <CogsInlineEdit
                    product={product}
                    onSave={async (data) => {
                      await onUpdateCogs(product.id, data);
                      setEditingId(null);
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                </td>
              </tr>
            )}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
}
