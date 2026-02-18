import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type IntegrationProvider = 'quickbooks' | 'xero';

export interface IntegrationDto {
  provider: IntegrationProvider;
  connected: boolean;
  lastSyncedAt: string | null;
  syncErrors: string[];
}

interface IntegrationsState {
  integrations: IntegrationDto[];
  loading: boolean;
  error: string | null;
  upgradeRequired: boolean;
  requiredPlan: string | null;

  fetchIntegrations: (authenticatedFetch: typeof fetch) => Promise<void>;
  connect: (
    authenticatedFetch: typeof fetch,
    provider: IntegrationProvider,
  ) => Promise<void>;
  syncCogs: (
    authenticatedFetch: typeof fetch,
    provider: IntegrationProvider,
  ) => Promise<void>;
  disconnect: (
    authenticatedFetch: typeof fetch,
    provider: IntegrationProvider,
  ) => Promise<void>;
}

export const useIntegrationsStore = create<IntegrationsState>()(
  devtools(
    (set) => ({
      integrations: [],
      loading: false,
      error: null,
      upgradeRequired: false,
      requiredPlan: null,

      fetchIntegrations: async (authenticatedFetch) => {
        set({ loading: true, error: null, upgradeRequired: false });
        try {
          const res = await authenticatedFetch('/api/admin/integrations');
          if (res.status === 403) {
            const body = await res.json();
            set({
              loading: false,
              upgradeRequired: true,
              requiredPlan: body.requiredPlan ?? 'GROWTH',
            });
            return;
          }
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.message || `Request failed (${res.status})`);
          }
          const data = await res.json();
          set({ integrations: data.items ?? data, loading: false });
        } catch (e: any) {
          set({ error: e.message, loading: false });
        }
      },

      connect: async (authenticatedFetch, provider) => {
        set({ error: null });
        try {
          const res = await authenticatedFetch(
            `/api/admin/integrations/${provider}/connect`,
            { method: 'POST' },
          );
          const data = await res.json();
          if (data.oauthUrl) {
            window.open(data.oauthUrl, '_blank', 'noopener,noreferrer');
          }
          // Re-fetch to get updated status after OAuth completes
          // The user will need to refresh or we poll
        } catch (e: any) {
          set({ error: e.message });
        }
      },

      syncCogs: async (authenticatedFetch, provider) => {
        set({ error: null });
        try {
          const res = await authenticatedFetch(
            `/api/admin/integrations/${provider}/sync`,
            { method: 'POST' },
          );
          const updated = await res.json();
          set((s) => ({
            integrations: s.integrations.map((i) =>
              i.provider === provider ? updated : i,
            ),
          }));
        } catch (e: any) {
          set({ error: e.message });
        }
      },

      disconnect: async (authenticatedFetch, provider) => {
        set({ error: null });
        try {
          await authenticatedFetch(`/api/admin/integrations/${provider}`, {
            method: 'DELETE',
          });
          set((s) => ({
            integrations: s.integrations.map((i) =>
              i.provider === provider
                ? { ...i, connected: false, lastSyncedAt: null, syncErrors: [] }
                : i,
            ),
          }));
        } catch (e: any) {
          set({ error: e.message });
        }
      },
    }),
    { name: 'integrations-store' },
  ),
);
