import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalyticsStore } from '../stores/analytics.store';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';
import { FunnelChart } from '../components/analytics/FunnelChart';
import { TopBundlesCard } from '../components/analytics/TopBundlesCard';
import { LoadingState } from '../components/common/LoadingState';
import { ThemeSetupBanner } from '../components/common/ThemeSetupBanner';

interface ProductPair {
  productA: string;
  productB: string;
  affinityScore: number;
}


const DATE_RANGE_OPTIONS: Array<{ value: '7d' | '30d' | '90d'; label: string }> = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
];

export function Dashboard() {
  const fetch = useAuthenticatedFetch();
  const navigate = useNavigate();
  const { dashboard, dateRange, loading, error, setDateRange, fetchDashboard } =
    useAnalyticsStore();

  const [productPairs, setProductPairs] = useState<ProductPair[]>([]);

  useEffect(() => {
    fetchDashboard(fetch);
  }, [dateRange]);

  useEffect(() => {
    fetch('/api/admin/analytics/product-pairs')
      .then((res) => res.json())
      .then((data) => setProductPairs(Array.isArray(data) ? data.slice(0, 5) : []))
      .catch(() => setProductPairs([]));
  }, []);

  const kpiCardStyle: React.CSSProperties = {
    flex: '1 1 0',
    minWidth: 'calc(50% - 12px)',
    padding: '16px',
    border: '1px solid #e1e3e5',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
  };

  const kpiLabelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#5c5f62',
    marginBottom: '4px',
  };

  const kpiValueStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 700,
    color: '#202223',
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h1 style={{ fontSize: '24px', margin: 0 }}>Dashboard</h1>
        <div style={{ display: 'flex', gap: '4px' }}>
          {DATE_RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDateRange(opt.value)}
              style={{
                padding: '6px 14px',
                borderRadius: '4px',
                border: '1px solid',
                borderColor:
                  dateRange === opt.value ? '#008060' : '#c9cccf',
                backgroundColor:
                  dateRange === opt.value ? '#f1f8f5' : '#ffffff',
                color:
                  dateRange === opt.value ? '#008060' : '#202223',
                fontWeight: dateRange === opt.value ? 600 : 400,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <ThemeSetupBanner />

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
      ) : !dashboard ? (
        <div
          style={{
            padding: '60px 40px',
            textAlign: 'center',
            color: '#6d7175',
          }}
        >
          <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>
            No data yet
          </h2>
          <p>
            Create bundles and wait for customer interactions to see your
            dashboard.
          </p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '20px',
              flexWrap: 'wrap',
            }}
          >
            <div style={kpiCardStyle}>
              <div style={kpiLabelStyle}>Bundle Revenue</div>
              <div style={kpiValueStyle}>
                $
                {dashboard.totalBundleRevenue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
            <div style={kpiCardStyle}>
              <div style={kpiLabelStyle}>Bundle Margin</div>
              <div
                style={{
                  ...kpiValueStyle,
                  color:
                    dashboard.totalBundleMargin >= 0 ? '#1a5632' : '#8c1a1a',
                }}
              >
                $
                {dashboard.totalBundleMargin.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
            <div style={kpiCardStyle}>
              <div style={kpiLabelStyle}>Conversion Rate</div>
              <div style={kpiValueStyle}>
                {dashboard.bundleConversionRate.toFixed(1)}%
              </div>
            </div>
            <div style={kpiCardStyle}>
              <div style={kpiLabelStyle}>Total Purchases</div>
              <div style={kpiValueStyle}>
                {dashboard.totalPurchases.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Funnel chart */}
          <div style={{ marginBottom: '20px' }}>
            <FunnelChart
              views={dashboard.totalViews}
              clicks={dashboard.totalClicks}
              addToCarts={dashboard.totalAddToCarts}
              purchases={dashboard.totalPurchases}
            />
          </div>

          {/* Top Bundles + Dead Stock row */}
          <div
            className="bundlify-dashboard-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '16px',
              marginBottom: '20px',
            }}
          >
            <TopBundlesCard topBundles={dashboard.topBundles} />

            {/* Dead stock summary card */}
            <div
              style={{
                border: '1px solid #e1e3e5',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <h3
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  margin: '0 0 16px 0',
                }}
              >
                Dead Stock Summary
              </h3>
              <div style={{ flex: 1, display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#6d7175' }}>
                    Total Dead Stock Value
                  </div>
                  <div
                    style={{
                      fontSize: '28px',
                      fontWeight: 700,
                      color: '#8c1a1a',
                      marginTop: '4px',
                    }}
                  >
                    $
                    {dashboard.deadStockValue.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#6d7175' }}>
                    Dead Stock Products
                  </div>
                  <div
                    style={{
                      fontSize: '28px',
                      fontWeight: 700,
                      color: '#6a5c00',
                      marginTop: '4px',
                    }}
                  >
                    {dashboard.deadStockCount.toLocaleString()}
                  </div>
                </div>
              </div>
              <p
                style={{
                  fontSize: '13px',
                  color: '#6d7175',
                  marginTop: '12px',
                  marginBottom: 0,
                }}
              >
                Use auto-generated Dead Stock bundles to clear slow-moving
                inventory profitably.
              </p>
            </div>
          </div>

          {/* Frequently Bought Together */}
          {productPairs.length > 0 && (
            <div
              style={{
                border: '1px solid #e1e3e5',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                padding: '16px',
                marginBottom: '20px',
              }}
            >
              <h3
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  margin: '0 0 12px 0',
                }}
              >
                Frequently Bought Together
              </h3>
              <div style={{ fontSize: '13px', color: '#6d7175', marginBottom: '12px' }}>
                Top product pairs by purchase affinity. Use these insights to create high-performing bundles.
              </div>
              {productPairs.map((pair, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 0',
                    borderBottom:
                      idx < productPairs.length - 1
                        ? '1px solid #f1f1f1'
                        : 'none',
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#202223',
                    }}
                  >
                    {pair.productA}
                    <span style={{ color: '#6d7175', margin: '0 6px' }}>+</span>
                    {pair.productB}
                  </div>
                  <div
                    style={{
                      width: '120px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        height: '6px',
                        backgroundColor: '#e4e5e7',
                        borderRadius: '3px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(pair.affinityScore, 100)}%`,
                          height: '100%',
                          backgroundColor: '#008060',
                          borderRadius: '3px',
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: '12px',
                        color: '#6d7175',
                        minWidth: '36px',
                        textAlign: 'right',
                      }}
                    >
                      {pair.affinityScore.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick actions */}
          <div
            style={{
              border: '1px solid #e1e3e5',
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: '#ffffff',
            }}
          >
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 600,
                margin: '0 0 12px 0',
              }}
            >
              Quick Actions
            </h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/bundles')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#008060',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                Create Bundle
              </button>
              <button
                onClick={() => navigate('/products')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ffffff',
                  color: '#202223',
                  border: '1px solid #c9cccf',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Import COGS
              </button>
              <button
                onClick={() => navigate('/products')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ffffff',
                  color: '#202223',
                  border: '1px solid #c9cccf',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                View Products
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
