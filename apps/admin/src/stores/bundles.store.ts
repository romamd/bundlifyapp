import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { BundleDto, CreateBundleDto } from '@bundlify/shared-types';

interface BundlesState {
  bundles: BundleDto[];
  currentBundle: BundleDto | null;
  loading: boolean;
  error: string | null;

  fetchBundles: (authenticatedFetch: typeof fetch) => Promise<void>;
  fetchBundle: (
    authenticatedFetch: typeof fetch,
    id: string,
  ) => Promise<void>;
  createBundle: (
    authenticatedFetch: typeof fetch,
    data: CreateBundleDto,
  ) => Promise<void>;
  updateBundle: (
    authenticatedFetch: typeof fetch,
    id: string,
    data: Partial<CreateBundleDto>,
  ) => Promise<void>;
  deleteBundle: (
    authenticatedFetch: typeof fetch,
    id: string,
  ) => Promise<void>;
  generateBundles: (
    authenticatedFetch: typeof fetch,
  ) => Promise<number>;
  setStatus: (
    authenticatedFetch: typeof fetch,
    id: string,
    status: string,
  ) => Promise<void>;
  clearCurrentBundle: () => void;
}

export const useBundlesStore = create<BundlesState>()(
  devtools(
    (set, get) => ({
      bundles: [],
      currentBundle: null,
      loading: false,
      error: null,

      fetchBundles: async (authenticatedFetch) => {
        set({ loading: true, error: null });
        try {
          const res = await authenticatedFetch('/api/admin/bundles');
          const data = await res.json();
          set({ bundles: data.items ?? data, loading: false });
        } catch (e: any) {
          set({ error: e.message, loading: false });
        }
      },

      fetchBundle: async (authenticatedFetch, id) => {
        set({ loading: true, error: null });
        try {
          const res = await authenticatedFetch(`/api/admin/bundles/${id}`);
          const data = await res.json();
          set({ currentBundle: data, loading: false });
        } catch (e: any) {
          set({ error: e.message, loading: false });
        }
      },

      createBundle: async (authenticatedFetch, data) => {
        set({ loading: true, error: null });
        try {
          const res = await authenticatedFetch('/api/admin/bundles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          const created = await res.json();
          set((s) => ({
            bundles: [created, ...s.bundles],
            loading: false,
          }));
        } catch (e: any) {
          set({ error: e.message, loading: false });
        }
      },

      updateBundle: async (authenticatedFetch, id, data) => {
        set({ loading: true, error: null });
        try {
          const res = await authenticatedFetch(`/api/admin/bundles/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          const updated = await res.json();
          set((s) => ({
            bundles: s.bundles.map((b) => (b.id === id ? updated : b)),
            currentBundle:
              s.currentBundle?.id === id ? updated : s.currentBundle,
            loading: false,
          }));
        } catch (e: any) {
          set({ error: e.message, loading: false });
        }
      },

      deleteBundle: async (authenticatedFetch, id) => {
        set({ loading: true, error: null });
        try {
          await authenticatedFetch(`/api/admin/bundles/${id}`, {
            method: 'DELETE',
          });
          set((s) => ({
            bundles: s.bundles.filter((b) => b.id !== id),
            currentBundle:
              s.currentBundle?.id === id ? null : s.currentBundle,
            loading: false,
          }));
        } catch (e: any) {
          set({ error: e.message, loading: false });
        }
      },

      generateBundles: async (authenticatedFetch) => {
        set({ loading: true, error: null });
        try {
          const res = await authenticatedFetch('/api/admin/bundles/generate', {
            method: 'POST',
          });
          const data = await res.json();
          const count = data.count ?? 0;
          // Re-fetch bundles to get the newly generated ones
          await get().fetchBundles(authenticatedFetch);
          return count;
        } catch (e: any) {
          set({ error: e.message, loading: false });
          return 0;
        }
      },

      clearCurrentBundle: () => set({ currentBundle: null }),

      setStatus: async (authenticatedFetch, id, status) => {
        set({ error: null });
        try {
          const res = await authenticatedFetch(`/api/admin/bundles/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
          });
          const updated = await res.json();
          set((s) => ({
            bundles: s.bundles.map((b) => (b.id === id ? updated : b)),
            currentBundle:
              s.currentBundle?.id === id ? updated : s.currentBundle,
          }));
        } catch (e: any) {
          set({ error: e.message });
        }
      },
    }),
    { name: 'bundles-store' },
  ),
);
