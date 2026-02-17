import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { DashboardDto } from '@bundlify/shared-types';

interface AnalyticsState {
  dashboard: DashboardDto | null;
  dateRange: '7d' | '30d' | '90d';
  loading: boolean;
  error: string | null;

  setDateRange: (range: '7d' | '30d' | '90d') => void;
  fetchDashboard: (authenticatedFetch: typeof fetch) => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>()(
  devtools(
    (set, get) => ({
      dashboard: null,
      dateRange: '30d',
      loading: false,
      error: null,

      setDateRange: (range) => set({ dateRange: range }),

      fetchDashboard: async (authenticatedFetch) => {
        set({ loading: true, error: null });
        try {
          const { dateRange } = get();
          const params = new URLSearchParams({ range: dateRange });
          const res = await authenticatedFetch(
            `/api/admin/analytics/dashboard?${params}`,
          );
          const data = await res.json();
          set({ dashboard: data, loading: false });
        } catch (e: any) {
          set({ error: e.message, loading: false });
        }
      },
    }),
    { name: 'analytics-store' },
  ),
);
