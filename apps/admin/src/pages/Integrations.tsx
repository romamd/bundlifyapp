import React, { useEffect, useState } from 'react';
import {
  useIntegrationsStore,
  IntegrationProvider,
  IntegrationDto,
} from '../stores/integrations.store';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';
import { LoadingState } from '../components/common/LoadingState';

const PROVIDER_INFO: Record<
  IntegrationProvider,
  { label: string; description: string }
> = {
  quickbooks: {
    label: 'QuickBooks',
    description:
      'Sync COGS data from QuickBooks Online to automatically calculate product margins.',
  },
  xero: {
    label: 'Xero',
    description:
      'Import cost of goods sold from your Xero account for accurate margin analysis.',
  },
};

function IntegrationCard({
  integration,
  onConnect,
  onSync,
  onDisconnect,
  syncing,
}: {
  integration: IntegrationDto;
  onConnect: () => void;
  onSync: () => void;
  onDisconnect: () => void;
  syncing: boolean;
}) {
  const info = PROVIDER_INFO[integration.provider];

  const statusDotStyle: React.CSSProperties = {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: integration.connected ? '#22c55e' : '#d1d5db',
    marginRight: '6px',
  };

  return (
    <div
      style={{
        border: '1px solid #e1e3e5',
        borderRadius: '8px',
        backgroundColor: '#ffffff',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '12px',
        }}
      >
        <div>
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 600,
              margin: '0 0 4px 0',
            }}
          >
            {info.label}
          </h3>
          <div style={{ fontSize: '13px', color: '#6d7175' }}>
            <span style={statusDotStyle} />
            {integration.connected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </div>

      {/* Description */}
      <p
        style={{
          fontSize: '13px',
          color: '#6d7175',
          margin: '0 0 16px 0',
          flex: 1,
        }}
      >
        {info.description}
      </p>

      {/* Last synced */}
      {integration.connected && integration.lastSyncedAt && (
        <div
          style={{
            fontSize: '12px',
            color: '#6d7175',
            marginBottom: '12px',
          }}
        >
          Last synced:{' '}
          {new Date(integration.lastSyncedAt).toLocaleString()}
        </div>
      )}

      {/* Sync errors */}
      {integration.syncErrors.length > 0 && (
        <div
          style={{
            padding: '8px 10px',
            backgroundColor: '#ffd2d2',
            borderRadius: '6px',
            marginBottom: '12px',
          }}
        >
          {integration.syncErrors.map((err, i) => (
            <div
              key={i}
              style={{ fontSize: '12px', color: '#8c1a1a' }}
            >
              {err}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {!integration.connected ? (
          <button
            onClick={onConnect}
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
            Connect
          </button>
        ) : (
          <>
            <button
              onClick={onSync}
              disabled={syncing}
              style={{
                padding: '8px 16px',
                backgroundColor: syncing ? '#e4e5e7' : '#008060',
                color: syncing ? '#6d7175' : '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: syncing ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
            <button
              onClick={onDisconnect}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ffffff',
                color: '#8c1a1a',
                border: '1px solid #ffd2d2',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Disconnect
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function Integrations() {
  const fetch = useAuthenticatedFetch();
  const {
    integrations,
    loading,
    error,
    fetchIntegrations,
    connect,
    syncCogs,
    disconnect,
  } = useIntegrationsStore();

  const [syncingProvider, setSyncingProvider] = useState<string | null>(null);

  useEffect(() => {
    fetchIntegrations(fetch);
  }, []);

  const handleSync = async (provider: IntegrationProvider) => {
    setSyncingProvider(provider);
    await syncCogs(fetch, provider);
    setSyncingProvider(null);
  };

  const handleDisconnect = async (provider: IntegrationProvider) => {
    if (
      window.confirm(
        `Are you sure you want to disconnect ${PROVIDER_INFO[provider].label}?`,
      )
    ) {
      await disconnect(fetch, provider);
    }
  };

  // Default integrations to show if API returns empty
  const displayIntegrations: IntegrationDto[] =
    integrations.length > 0
      ? integrations
      : [
          {
            provider: 'quickbooks',
            connected: false,
            lastSyncedAt: null,
            syncErrors: [],
          },
          {
            provider: 'xero',
            connected: false,
            lastSyncedAt: null,
            syncErrors: [],
          },
        ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', margin: '0 0 8px 0' }}>
          Integrations
        </h1>
        <p style={{ fontSize: '14px', color: '#6d7175', margin: 0 }}>
          Connect your accounting software to automatically sync COGS data and
          improve margin calculations.
        </p>
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
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
          }}
        >
          {displayIntegrations.map((integration) => (
            <IntegrationCard
              key={integration.provider}
              integration={integration}
              onConnect={() => connect(fetch, integration.provider)}
              onSync={() => handleSync(integration.provider)}
              onDisconnect={() => handleDisconnect(integration.provider)}
              syncing={syncingProvider === integration.provider}
            />
          ))}
        </div>
      )}
    </div>
  );
}
