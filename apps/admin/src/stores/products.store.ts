import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ProductDto, UpdateCogsDto, BulkCogsRow } from '@bundlify/shared-types';

interface ProductFilters {
  search: string;
  deadStockOnly: boolean;
  missingCogsOnly: boolean;
  sortBy: 'title' | 'margin' | 'daysWithoutSale' | 'price';
  sortDir: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

interface ProductsState {
  products: ProductDto[];
  total: number;
  loading: boolean;
  error: string | null;
  filters: ProductFilters;

  setFilters: (filters: Partial<ProductFilters>) => void;
  fetchProducts: (authenticatedFetch: typeof fetch) => Promise<void>;
  updateCogs: (
    authenticatedFetch: typeof fetch,
    productId: string,
    data: UpdateCogsDto,
  ) => Promise<void>;
  bulkImportCogs: (
    authenticatedFetch: typeof fetch,
    rows: BulkCogsRow[],
  ) => Promise<{ matched: number; unmatched: number }>;
}

export const useProductsStore = create<ProductsState>()(
  devtools(
    (set, get) => ({
      products: [],
      total: 0,
      loading: false,
      error: null,
      filters: {
        search: '',
        deadStockOnly: false,
        missingCogsOnly: false,
        sortBy: 'title',
        sortDir: 'asc',
        page: 1,
        pageSize: 25,
      },

      setFilters: (partial) =>
        set((s) => ({ filters: { ...s.filters, ...partial, page: 1 } })),

      fetchProducts: async (authenticatedFetch) => {
        set({ loading: true, error: null });
        try {
          const { filters } = get();
          const params = new URLSearchParams({
            search: filters.search,
            deadStockOnly: String(filters.deadStockOnly),
            missingCogsOnly: String(filters.missingCogsOnly),
            sortBy: filters.sortBy,
            sortDir: filters.sortDir,
            page: String(filters.page),
            pageSize: String(filters.pageSize),
          });
          const res = await authenticatedFetch(`/api/admin/products?${params}`);
          const data = await res.json();
          set({ products: data.items, total: data.total, loading: false });
        } catch (e: any) {
          set({ error: e.message, loading: false });
        }
      },

      updateCogs: async (authenticatedFetch, productId, data) => {
        const res = await authenticatedFetch(
          `/api/admin/products/${productId}/costs`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          },
        );
        const updated = await res.json();
        set((s) => ({
          products: s.products.map((p) =>
            p.id === productId ? updated : p,
          ),
        }));
      },

      bulkImportCogs: async (authenticatedFetch, rows) => {
        const res = await authenticatedFetch('/api/admin/products/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows }),
        });
        return res.json();
      },
    }),
    { name: 'products-store' },
  ),
);
