import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ShopSettingsDto } from '@bundlify/shared-types';

interface SettingsState {
  settings: ShopSettingsDto | null;
  loading: boolean;
  saving: boolean;
  error: string | null;

  fetchSettings: (authenticatedFetch: typeof fetch) => Promise<void>;
  updateSettings: (
    authenticatedFetch: typeof fetch,
    data: Partial<ShopSettingsDto>,
  ) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
  devtools(
    (set) => ({
      settings: null,
      loading: false,
      saving: false,
      error: null,

      fetchSettings: async (authenticatedFetch) => {
        set({ loading: true, error: null });
        try {
          const res = await authenticatedFetch('/api/admin/settings');
          const data = await res.json();
          set({ settings: data, loading: false });
        } catch (e: any) {
          set({ error: e.message, loading: false });
        }
      },

      updateSettings: async (authenticatedFetch, data) => {
        set({ saving: true, error: null });
        try {
          const res = await authenticatedFetch('/api/admin/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          const updated = await res.json();
          set({ settings: updated, saving: false });
        } catch (e: any) {
          set({ error: e.message, saving: false });
        }
      },
    }),
    { name: 'settings-store' },
  ),
);
