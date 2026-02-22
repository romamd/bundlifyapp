import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type ABTestStatus = 'DRAFT' | 'RUNNING' | 'COMPLETED';

export interface ABTestMetrics {
  impressions: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
}

export interface ABTestDto {
  id: string;
  name: string;
  bundleId: string;
  bundleName: string;
  status: ABTestStatus;
  variantDiscountPct: number;
  controlMetrics: ABTestMetrics;
  variantMetrics: ABTestMetrics;
  winner: 'control' | 'variant' | null;
  confidence: number | null;
  createdAt: string;
}

export interface CreateABTestDto {
  name: string;
  bundleId: string;
  variantDiscountPct: number;
}

interface ABTestsState {
  tests: ABTestDto[];
  loading: boolean;
  error: string | null;
  upgradeRequired: boolean;
  requiredPlan: string | null;

  fetchTests: (authenticatedFetch: typeof fetch) => Promise<void>;
  createTest: (
    authenticatedFetch: typeof fetch,
    data: CreateABTestDto,
  ) => Promise<void>;
  startTest: (
    authenticatedFetch: typeof fetch,
    id: string,
  ) => Promise<void>;
  stopTest: (
    authenticatedFetch: typeof fetch,
    id: string,
  ) => Promise<void>;
  applyWinner: (
    authenticatedFetch: typeof fetch,
    id: string,
  ) => Promise<void>;
}

export const useABTestsStore = create<ABTestsState>()(
  devtools(
    (set) => ({
      tests: [],
      loading: false,
      error: null,
      upgradeRequired: false,
      requiredPlan: null,

      fetchTests: async (authenticatedFetch) => {
        set({ loading: true, error: null, upgradeRequired: false });
        try {
          const res = await authenticatedFetch('/api/admin/ab-tests');
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
          set({ tests: data.items ?? data, loading: false });
        } catch (e: any) {
          set({ error: e.message, loading: false });
        }
      },

      createTest: async (authenticatedFetch, data) => {
        set({ loading: true, error: null });
        try {
          const res = await authenticatedFetch('/api/admin/ab-tests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.message || `Request failed (${res.status})`);
          }
          const created = await res.json();
          set((s) => ({
            tests: [created, ...s.tests],
            loading: false,
          }));
        } catch (e: any) {
          set({ error: e.message, loading: false });
        }
      },

      startTest: async (authenticatedFetch, id) => {
        set({ error: null });
        try {
          const res = await authenticatedFetch(
            `/api/admin/ab-tests/${id}/start`,
            { method: 'POST' },
          );
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.message || `Request failed (${res.status})`);
          }
          const updated = await res.json();
          set((s) => ({
            tests: s.tests.map((t) => (t.id === id ? updated : t)),
          }));
        } catch (e: any) {
          set({ error: e.message });
        }
      },

      stopTest: async (authenticatedFetch, id) => {
        set({ error: null });
        try {
          const res = await authenticatedFetch(
            `/api/admin/ab-tests/${id}/stop`,
            { method: 'POST' },
          );
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.message || `Request failed (${res.status})`);
          }
          const updated = await res.json();
          set((s) => ({
            tests: s.tests.map((t) => (t.id === id ? updated : t)),
          }));
        } catch (e: any) {
          set({ error: e.message });
        }
      },

      applyWinner: async (authenticatedFetch, id) => {
        set({ error: null });
        try {
          const res = await authenticatedFetch(
            `/api/admin/ab-tests/${id}/apply`,
            { method: 'POST' },
          );
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.message || `Request failed (${res.status})`);
          }
          // Remove the applied marker or just re-fetch to keep state consistent
          set((s) => ({
            tests: s.tests.map((t) =>
              t.id === id ? { ...t, status: 'COMPLETED' as ABTestStatus } : t,
            ),
          }));
        } catch (e: any) {
          set({ error: e.message });
        }
      },
    }),
    { name: 'ab-tests-store' },
  ),
);
