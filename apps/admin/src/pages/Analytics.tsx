import React, { useEffect, useState } from 'react';
import { useAnalyticsStore } from '../stores/analytics.store';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';
import { RevenueChart } from '../components/analytics/RevenueChart';
import { FunnelChart } from '../components/analytics/FunnelChart';
import { LoadingState } from '../components/common/LoadingState';

const DATE_RANGE_OPTIONS: Array<{ value: '7d' | '30d' | '90d'; label: string }> = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
];

/** Generate placeholder revenue data for the chart based on date range */
function generatePlaceholderData(
  range: '7d' | '30d' | '90d',
  totalRevenue: number,
  totalMargin: number,
): Array<{ date: string; revenue: number; margin: number }> {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const data: Array<{ date: string; revenue: number; margin: number }> = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;

    // Distribute totals across days with some variance
    const factor = 0.6 + Math.random() * 0.8;
    const dailyRevenue = (totalRevenue / days) * factor;
    const dailyMargin = (totalMargin / days) * factor;

    data.push({
      date: dateStr,
      revenue: Math.round(dailyRevenue * 100) / 100,
      margin: Math.round(dailyMargin * 100) / 100,
    });
  }

  return data;
}

export function Analytics() {
  const fetch = useAuthenticatedFetch();
  const { dashboard, dateRange, loading, error, setDateRange, fetchDashboard } =
    useAnalyticsStore();

  const [revenueData, setRevenueData] = useState<
    Array<{ date: string; revenue: number; margin: number }>
  >([]);

  useEffect(() => {
    fetchDashboard(fetch);
  }, [dateRange]);

  useEffect(() => {
    if (dashboard) {
      setRevenueData(
        generatePlaceholderData(
          dateRange,
          dashboard.totalBundleRevenue,
          dashboard.totalBundleMargin,
        ),
      );
    }
  }, [dashboard, dateRange]);

  const cellStyle: React.CSSProperties = {
    padding: '10px 12px',
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
        <h1 style={{ fontSize: '24px', margin: 0 }}>Analytics</h1>
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
            No analytics data yet
          </h2>
          <p>
            Start creating bundles and drive traffic to see analytics data here.
          </p>
        </div>
      ) : (
        <>
          {/* Revenue Chart */}
          <div style={{ marginBottom: '20px' }}>
            <RevenueChart data={revenueData} />
          </div>

          {/* Funnel Chart */}
          <div style={{ marginBottom: '20px' }}>
            <FunnelChart
              views={dashboard.totalViews}
              clicks={dashboard.totalClicks}
              addToCarts={dashboard.totalAddToCarts}
              purchases={dashboard.totalPurchases}
            />
          </div>

          {/* Per-bundle breakdown */}
          <div
            style={{
              border: '1px solid #e1e3e5',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#ffffff',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #e1e3e5',
              }}
            >
              <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>
                Per-Bundle Breakdown
              </h3>
            </div>

            {dashboard.topBundles.length === 0 ? (
              <div
                style={{
                  padding: '24px',
                  textAlign: 'center',
                  color: '#6d7175',
                  fontSize: '14px',
                }}
              >
                No per-bundle data available yet.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={headerStyle}>Bundle</th>
                    <th style={{ ...headerStyle, textAlign: 'right' }}>
                      Revenue
                    </th>
                    <th style={{ ...headerStyle, textAlign: 'right' }}>
                      Margin
                    </th>
                    <th style={{ ...headerStyle, textAlign: 'right' }}>
                      Margin %
                    </th>
                    <th style={{ ...headerStyle, textAlign: 'right' }}>
                      Conversions
                    </th>
                    <th style={{ ...headerStyle, textAlign: 'right' }}>
                      Avg Order
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.topBundles.map((bundle) => {
                    const marginPct =
                      bundle.revenue > 0
                        ? (bundle.margin / bundle.revenue) * 100
                        : 0;
                    const avgOrder =
                      bundle.conversions > 0
                        ? bundle.revenue / bundle.conversions
                        : 0;
                    return (
                      <tr key={bundle.bundleId}>
                        <td style={cellStyle}>
                          <span style={{ fontWeight: 500 }}>{bundle.name}</span>
                        </td>
                        <td style={{ ...cellStyle, textAlign: 'right' }}>
                          $
                          {bundle.revenue.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td
                          style={{
                            ...cellStyle,
                            textAlign: 'right',
                            color:
                              bundle.margin >= 0 ? '#1a5632' : '#8c1a1a',
                            fontWeight: 500,
                          }}
                        >
                          $
                          {bundle.margin.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td
                          style={{
                            ...cellStyle,
                            textAlign: 'right',
                            color:
                              marginPct >= 30
                                ? '#1a5632'
                                : marginPct >= 15
                                  ? '#6a5c00'
                                  : '#8c1a1a',
                          }}
                        >
                          {marginPct.toFixed(1)}%
                        </td>
                        <td style={{ ...cellStyle, textAlign: 'right' }}>
                          {bundle.conversions.toLocaleString()}
                        </td>
                        <td style={{ ...cellStyle, textAlign: 'right' }}>
                          $
                          {avgOrder.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
