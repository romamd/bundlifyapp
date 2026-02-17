import React from 'react';

interface TopBundle {
  bundleId: string;
  name: string;
  revenue: number;
  margin: number;
  conversions: number;
}

interface TopBundlesCardProps {
  topBundles: TopBundle[];
}

export function TopBundlesCard({ topBundles }: TopBundlesCardProps) {
  const cellStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderBottom: '1px solid #f1f1f1',
    fontSize: '13px',
    verticalAlign: 'middle',
  };

  const headerStyle: React.CSSProperties = {
    ...cellStyle,
    fontWeight: 600,
    fontSize: '12px',
    color: '#6d7175',
    backgroundColor: '#f6f6f7',
    borderBottom: '1px solid #e1e3e5',
  };

  return (
    <div
      style={{
        border: '1px solid #e1e3e5',
        borderRadius: '8px',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e1e3e5',
        }}
      >
        <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>
          Top Bundles
        </h3>
      </div>

      {topBundles.length === 0 ? (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            color: '#6d7175',
            fontSize: '14px',
          }}
        >
          No bundle performance data yet.
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={headerStyle}>Bundle</th>
              <th style={{ ...headerStyle, textAlign: 'right' }}>Revenue</th>
              <th style={{ ...headerStyle, textAlign: 'right' }}>Margin</th>
              <th style={{ ...headerStyle, textAlign: 'right' }}>Sales</th>
            </tr>
          </thead>
          <tbody>
            {topBundles.slice(0, 5).map((bundle, idx) => (
              <tr key={bundle.bundleId}>
                <td style={cellStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor:
                          idx === 0
                            ? '#008060'
                            : idx === 1
                              ? '#228be6'
                              : '#e4e5e7',
                        color:
                          idx <= 1 ? '#ffffff' : '#6d7175',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {bundle.name}
                    </span>
                  </div>
                </td>
                <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 500 }}>
                  ${bundle.revenue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td
                  style={{
                    ...cellStyle,
                    textAlign: 'right',
                    color: bundle.margin >= 0 ? '#1a5632' : '#8c1a1a',
                  }}
                >
                  ${bundle.margin.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td style={{ ...cellStyle, textAlign: 'right' }}>
                  {bundle.conversions.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
