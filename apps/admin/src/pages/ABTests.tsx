import React, { useEffect, useState } from 'react';
import {
  useABTestsStore,
  ABTestDto,
  ABTestStatus,
  CreateABTestDto,
} from '../stores/ab-tests.store';
import { useBundlesStore } from '../stores/bundles.store';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';

const STATUS_COLORS: Record<ABTestStatus, { bg: string; text: string }> = {
  DRAFT: { bg: '#e4e5e7', text: '#6d7175' },
  RUNNING: { bg: '#dbeafe', text: '#1e40af' },
  COMPLETED: { bg: '#d1fae5', text: '#065f46' },
};

function StatusBadge({ status }: { status: ABTestStatus }) {
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.DRAFT;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '10px',
        fontSize: '12px',
        fontWeight: 600,
        backgroundColor: colors.bg,
        color: colors.text,
      }}
    >
      {status}
    </span>
  );
}

function MetricsRow({
  label,
  control,
  variant,
}: {
  label: string;
  control: string;
  variant: string;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        padding: '6px 0',
        borderBottom: '1px solid #f1f1f1',
        fontSize: '13px',
      }}
    >
      <div style={{ color: '#6d7175' }}>{label}</div>
      <div style={{ textAlign: 'right' }}>{control}</div>
      <div style={{ textAlign: 'right' }}>{variant}</div>
    </div>
  );
}

function TestCard({
  test,
  onStart,
  onStop,
}: {
  test: ABTestDto;
  onStart: () => void;
  onStop: () => void;
}) {
  const cardStyle: React.CSSProperties = {
    border: '1px solid #e1e3e5',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    padding: '16px',
    marginBottom: '12px',
  };

  return (
    <div style={cardStyle}>
      {/* Card header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <div>
          <span style={{ fontWeight: 600, fontSize: '15px', marginRight: '8px' }}>
            {test.name}
          </span>
          <StatusBadge status={test.status} />
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {test.status === 'DRAFT' && (
            <button
              onClick={onStart}
              style={{
                padding: '6px 14px',
                backgroundColor: '#008060',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              Start Test
            </button>
          )}
          {test.status === 'RUNNING' && (
            <button
              onClick={onStop}
              style={{
                padding: '6px 14px',
                backgroundColor: '#ffffff',
                color: '#8c1a1a',
                border: '1px solid #ffd2d2',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Stop Test
            </button>
          )}
          {test.status === 'COMPLETED' && test.winner && (
            <button
              style={{
                padding: '6px 14px',
                backgroundColor: '#008060',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              Apply Winner
            </button>
          )}
        </div>
      </div>

      {/* Bundle and variant info */}
      <div
        style={{
          fontSize: '13px',
          color: '#6d7175',
          marginBottom: '12px',
        }}
      >
        Bundle: <strong style={{ color: '#202223' }}>{test.bundleName}</strong>
        <span style={{ margin: '0 8px' }}>|</span>
        Variant Discount: <strong style={{ color: '#202223' }}>{test.variantDiscountPct}%</strong>
      </div>

      {/* Metrics table for RUNNING and COMPLETED */}
      {(test.status === 'RUNNING' || test.status === 'COMPLETED') && (
        <div>
          {/* Table header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              padding: '6px 0',
              borderBottom: '1px solid #e1e3e5',
              fontSize: '12px',
              fontWeight: 600,
              color: '#6d7175',
            }}
          >
            <div>Metric</div>
            <div style={{ textAlign: 'right' }}>Control</div>
            <div style={{ textAlign: 'right' }}>Variant</div>
          </div>

          <MetricsRow
            label="Impressions"
            control={test.controlMetrics.impressions.toLocaleString()}
            variant={test.variantMetrics.impressions.toLocaleString()}
          />
          <MetricsRow
            label="Conversions"
            control={test.controlMetrics.conversions.toLocaleString()}
            variant={test.variantMetrics.conversions.toLocaleString()}
          />
          <MetricsRow
            label="Conversion Rate"
            control={`${test.controlMetrics.conversionRate.toFixed(1)}%`}
            variant={`${test.variantMetrics.conversionRate.toFixed(1)}%`}
          />
          <MetricsRow
            label="Revenue"
            control={`$${test.controlMetrics.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            variant={`$${test.variantMetrics.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          />
        </div>
      )}

      {/* Winner info for COMPLETED */}
      {test.status === 'COMPLETED' && test.winner && (
        <div
          style={{
            marginTop: '12px',
            padding: '10px 12px',
            backgroundColor: '#f1f8f5',
            borderRadius: '6px',
            fontSize: '13px',
          }}
        >
          Winner:{' '}
          <strong style={{ color: '#1a5632' }}>
            {test.winner === 'control' ? 'Control (Original)' : 'Variant'}
          </strong>
          {test.confidence !== null && (
            <span style={{ marginLeft: '12px', color: '#6d7175' }}>
              Confidence: {test.confidence.toFixed(1)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function ABTests() {
  const fetch = useAuthenticatedFetch();
  const { tests, loading, error, upgradeRequired, requiredPlan, fetchTests, createTest, startTest, stopTest } =
    useABTestsStore();
  const { bundles, fetchBundles } = useBundlesStore();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateABTestDto>({
    name: '',
    bundleId: '',
    variantDiscountPct: 10,
  });

  useEffect(() => {
    fetchTests(fetch);
    if (bundles.length === 0) {
      fetchBundles(fetch);
    }
  }, []);

  const handleCreate = async () => {
    if (!form.name || !form.bundleId) return;
    await createTest(fetch, form);
    setForm({ name: '', bundleId: '', variantDiscountPct: 10 });
    setShowForm(false);
  };

  const activeBundles = bundles.filter((b) => b.status === 'ACTIVE');

  const inputStyle: React.CSSProperties = {
    padding: '6px 10px',
    border: '1px solid #c9cccf',
    borderRadius: '4px',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box',
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
        <h1 style={{ fontSize: '24px', margin: 0 }}>A/B Tests</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '8px 16px',
            backgroundColor: showForm ? '#e4e5e7' : '#008060',
            color: showForm ? '#202223' : '#ffffff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          {showForm ? 'Cancel' : 'Create Test'}
        </button>
      </div>

      {/* Inline create form */}
      {showForm && (
        <div
          style={{
            border: '1px solid #e1e3e5',
            borderRadius: '8px',
            padding: '20px',
            backgroundColor: '#ffffff',
            marginBottom: '16px',
          }}
        >
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 600,
              margin: '0 0 16px 0',
            }}
          >
            New A/B Test
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 120px',
              gap: '12px',
              alignItems: 'end',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  color: '#6d7175',
                  marginBottom: '4px',
                }}
              >
                Test Name
              </label>
              <input
                type="text"
                placeholder="e.g. Summer Bundle Discount Test"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  color: '#6d7175',
                  marginBottom: '4px',
                }}
              >
                Bundle
              </label>
              <select
                value={form.bundleId}
                onChange={(e) => setForm({ ...form, bundleId: e.target.value })}
                style={inputStyle}
              >
                <option value="">Select a bundle...</option>
                {activeBundles.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  color: '#6d7175',
                  marginBottom: '4px',
                }}
              >
                Variant %
              </label>
              <input
                type="number"
                value={form.variantDiscountPct}
                onChange={(e) =>
                  setForm({
                    ...form,
                    variantDiscountPct: parseFloat(e.target.value) || 0,
                  })
                }
                min={1}
                max={100}
                step={1}
                style={inputStyle}
              />
            </div>
          </div>
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
            <button
              onClick={handleCreate}
              disabled={!form.name || !form.bundleId}
              style={{
                padding: '8px 16px',
                backgroundColor:
                  !form.name || !form.bundleId ? '#e4e5e7' : '#008060',
                color:
                  !form.name || !form.bundleId ? '#6d7175' : '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor:
                  !form.name || !form.bundleId ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              Create Test
            </button>
          </div>
        </div>
      )}

      {upgradeRequired && (
        <div
          style={{
            padding: '24px',
            backgroundColor: '#fff8e6',
            border: '1px solid #ffd966',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#7a5b00' }}>
            Upgrade Required
          </h2>
          <p style={{ margin: '0 0 16px 0', color: '#6d7175', fontSize: '14px' }}>
            A/B Testing requires the <strong>{requiredPlan}</strong> plan. Upgrade to
            unlock split-testing, smart discount optimization, and more.
          </p>
          <button
            onClick={() => window.open('/api/admin/billing/subscribe', '_top')}
            style={{
              padding: '10px 24px',
              backgroundColor: '#008060',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Upgrade Plan
          </button>
        </div>
      )}

      {error && !upgradeRequired && (
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
      ) : tests.length === 0 ? (
        <EmptyState
          heading="No A/B tests yet"
          message="Create an A/B test to optimize your bundle discounts and maximize conversions."
          action={{ label: 'Create Test', onClick: () => setShowForm(true) }}
        />
      ) : (
        <>
          <div
            style={{
              fontSize: '13px',
              color: '#6d7175',
              marginBottom: '8px',
            }}
          >
            {tests.length} test{tests.length !== 1 ? 's' : ''} total
          </div>
          {tests.map((test) => (
            <TestCard
              key={test.id}
              test={test}
              onStart={() => startTest(fetch, test.id)}
              onStop={() => stopTest(fetch, test.id)}
            />
          ))}
        </>
      )}
    </div>
  );
}
