import React, { useEffect, useState } from 'react';
import { useProductsStore } from '../stores/products.store';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';
import { ProductTable } from '../components/products/ProductTable';
import { CogsCsvImport } from '../components/products/CogsCsvImport';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';

export function Products() {
  const fetch = useAuthenticatedFetch();
  const {
    products,
    total,
    loading,
    error,
    filters,
    setFilters,
    fetchProducts,
    updateCogs,
    bulkImportCogs,
  } = useProductsStore();
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    fetchProducts(fetch);
  }, [filters.page, filters.sortBy, filters.sortDir]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchProducts(fetch);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', margin: 0 }}>Products</h1>
        <button
          onClick={() => setShowImport(!showImport)}
          style={{
            padding: '8px 16px',
            backgroundColor: showImport ? '#e4e5e7' : '#008060',
            color: showImport ? '#202223' : 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {showImport ? 'Close Import' : 'Import COGS'}
        </button>
      </div>

      {showImport && (
        <div style={{ marginBottom: '20px' }}>
          <CogsCsvImport
            onImport={async (rows) => {
              const result = await bulkImportCogs(fetch, rows);
              await fetchProducts(fetch);
              return result;
            }}
          />
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            style={{
              padding: '6px 12px',
              border: '1px solid #c9cccf',
              borderRadius: '4px',
              width: '250px',
            }}
          />
          <button type="submit" style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #c9cccf', cursor: 'pointer' }}>
            Search
          </button>
        </form>

        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
          <input
            type="checkbox"
            checked={filters.deadStockOnly}
            onChange={(e) => {
              setFilters({ deadStockOnly: e.target.checked });
              fetchProducts(fetch);
            }}
          />
          Dead stock only
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
          <input
            type="checkbox"
            checked={filters.missingCogsOnly}
            onChange={(e) => {
              setFilters({ missingCogsOnly: e.target.checked });
              fetchProducts(fetch);
            }}
          />
          Missing COGS only
        </label>

        <select
          value={`${filters.sortBy}-${filters.sortDir}`}
          onChange={(e) => {
            const [sortBy, sortDir] = e.target.value.split('-') as [any, any];
            setFilters({ sortBy, sortDir });
            fetchProducts(fetch);
          }}
          style={{ padding: '6px', borderRadius: '4px', border: '1px solid #c9cccf' }}
        >
          <option value="title-asc">Title A-Z</option>
          <option value="title-desc">Title Z-A</option>
          <option value="margin-desc">Highest Margin</option>
          <option value="margin-asc">Lowest Margin</option>
          <option value="price-desc">Highest Price</option>
          <option value="price-asc">Lowest Price</option>
          <option value="daysWithoutSale-desc">Most Dead Stock</option>
        </select>
      </div>

      {error && (
        <div style={{ color: '#8c1a1a', padding: '12px', marginBottom: '12px' }}>
          Error: {error}
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : products.length === 0 ? (
        <EmptyState
          heading="No products found"
          message="Sync your products from Shopify to get started."
        />
      ) : (
        <>
          <div style={{ fontSize: '13px', color: '#6d7175', marginBottom: '8px' }}>
            Showing {products.length} of {total} products
          </div>
          <ProductTable
            products={products}
            onUpdateCogs={async (productId, data) => {
              await updateCogs(fetch, productId, data);
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
            <button
              disabled={filters.page <= 1}
              onClick={() => {
                setFilters({ page: filters.page - 1 });
                fetchProducts(fetch);
              }}
              style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #c9cccf', cursor: 'pointer' }}
            >
              Previous
            </button>
            <span style={{ padding: '6px', fontSize: '14px' }}>
              Page {filters.page} of {Math.ceil(total / filters.pageSize)}
            </span>
            <button
              disabled={filters.page >= Math.ceil(total / filters.pageSize)}
              onClick={() => {
                setFilters({ page: filters.page + 1 });
                fetchProducts(fetch);
              }}
              style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #c9cccf', cursor: 'pointer' }}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
