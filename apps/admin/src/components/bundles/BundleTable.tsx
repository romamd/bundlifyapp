import React from 'react';
import type { BundleDto } from '@bundlify/shared-types';
import { MarginBadge } from '../products/MarginBadge';

interface BundleTableProps {
  bundles: BundleDto[];
  onEdit: (bundle: BundleDto) => void;
  onDelete: (bundleId: string) => void;
  onStatusChange: (bundleId: string, status: string) => void;
  onCreateABTest?: (bundleId: string) => void;
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  ACTIVE: { bg: '#aee9d1', color: '#1a5632' },
  DRAFT: { bg: '#e4e5e7', color: '#6d7175' },
  PAUSED: { bg: '#ffea8a', color: '#6a5c00' },
  EXPIRED: { bg: '#ffd2d2', color: '#8c1a1a' },
  ARCHIVED: { bg: '#ffd2d2', color: '#8c1a1a' },
};

const TYPE_LABELS: Record<string, string> = {
  FIXED: 'Fixed',
  MIX_MATCH: 'Mix & Match',
  VOLUME: 'Volume',
  CROSS_SELL: 'Cross-Sell',
  DEAD_STOCK: 'Dead Stock',
};

function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.DRAFT;
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: '4px',
        backgroundColor: colors.bg,
        color: colors.color,
        fontSize: '12px',
        fontWeight: 600,
      }}
    >
      {status}
    </span>
  );
}

export function BundleTable({
  bundles,
  onEdit,
  onDelete,
  onStatusChange,
  onCreateABTest,
}: BundleTableProps) {
  const cellStyle: React.CSSProperties = {
    padding: '10px 12px',
    borderBottom: '1px solid #f1f1f1',
    fontSize: '14px',
    verticalAlign: 'middle',
  };

  const headerStyle: React.CSSProperties = {
    ...cellStyle,
    fontWeight: 600,
    fontSize: '13px',
    color: '#6d7175',
    backgroundColor: '#f6f6f7',
    borderBottom: '1px solid #e1e3e5',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '4px 10px',
    borderRadius: '4px',
    border: '1px solid #c9cccf',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    fontSize: '12px',
  };

  if (bundles.length === 0) {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          color: '#6d7175',
          fontSize: '14px',
        }}
      >
        No bundles found. Create your first bundle or generate bundles
        automatically.
      </div>
    );
  }

  return (
    <div
      style={{
        border: '1px solid #e1e3e5',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
        }}
      >
        <thead>
          <tr>
            <th style={headerStyle}>Name</th>
            <th style={headerStyle}>Type</th>
            <th style={{ ...headerStyle, textAlign: 'right' }}>Discount</th>
            <th style={{ ...headerStyle, textAlign: 'right' }}>Margin</th>
            <th style={{ ...headerStyle, textAlign: 'center' }}>Status</th>
            <th style={{ ...headerStyle, textAlign: 'right' }}>Redemptions</th>
            <th style={{ ...headerStyle, textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bundles.map((bundle) => (
            <tr key={bundle.id}>
              <td style={cellStyle}>
                <div style={{ fontWeight: 500 }}>{bundle.name}</div>
                <div style={{ fontSize: '12px', color: '#6d7175' }}>
                  {bundle.items.length} item{bundle.items.length !== 1 ? 's' : ''}{' '}
                  | ${bundle.bundlePrice.toFixed(2)}
                </div>
              </td>
              <td style={cellStyle}>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#f6f6f7',
                    fontSize: '12px',
                  }}
                >
                  {TYPE_LABELS[bundle.type] ?? bundle.type}
                </span>
              </td>
              <td style={{ ...cellStyle, textAlign: 'right' }}>
                {bundle.discountPct.toFixed(0)}%
              </td>
              <td style={{ ...cellStyle, textAlign: 'right' }}>
                <MarginBadge marginPct={bundle.contributionMarginPct} />
              </td>
              <td style={{ ...cellStyle, textAlign: 'center' }}>
                <StatusBadge status={bundle.status} />
              </td>
              <td style={{ ...cellStyle, textAlign: 'right' }}>
                {bundle.currentRedemptions.toLocaleString()}
              </td>
              <td style={{ ...cellStyle, textAlign: 'right' }}>
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                  {bundle.status === 'ACTIVE' ? (
                    <button
                      onClick={() => onStatusChange(bundle.id, 'PAUSED')}
                      style={{
                        ...buttonStyle,
                        color: '#6a5c00',
                        backgroundColor: '#fff8e5',
                        borderColor: '#ffea8a',
                      }}
                    >
                      Pause
                    </button>
                  ) : bundle.status === 'DRAFT' || bundle.status === 'PAUSED' ? (
                    <button
                      onClick={() => onStatusChange(bundle.id, 'ACTIVE')}
                      style={{
                        ...buttonStyle,
                        color: '#1a5632',
                        backgroundColor: '#f1f8f5',
                        borderColor: '#aee9d1',
                      }}
                    >
                      Activate
                    </button>
                  ) : null}
                  {bundle.status === 'ACTIVE' && onCreateABTest && (
                    <button
                      onClick={() => onCreateABTest(bundle.id)}
                      style={{
                        ...buttonStyle,
                        color: '#1e40af',
                        backgroundColor: '#eff6ff',
                        borderColor: '#bfdbfe',
                      }}
                      title="Create A/B Test"
                    >
                      A/B
                    </button>
                  )}
                  <button onClick={() => onEdit(bundle)} style={buttonStyle}>
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(bundle.id)}
                    style={{
                      ...buttonStyle,
                      color: '#8c1a1a',
                      borderColor: '#ffd2d2',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
