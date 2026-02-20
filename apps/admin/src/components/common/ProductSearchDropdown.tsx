import React, { useCallback } from 'react';
import { SearchDropdown, type SearchDropdownItem } from './SearchDropdown';

interface ProductSearchDropdownProps {
  value: string;
  onChange: (shopifyProductId: string) => void;
  fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  placeholder?: string;
}

export function ProductSearchDropdown({
  value,
  onChange,
  fetch: authenticatedFetch,
  placeholder = 'Search products...',
}: ProductSearchDropdownProps) {
  const mapItem = useCallback((item: any) => {
    const label = item.title + (item.variantTitle ? ` - ${item.variantTitle}` : '');
    return {
      item: {
        id: item.id,
        label,
        subtitle: item.variantTitle,
        imageUrl: item.imageUrl,
        detail: item.price != null ? `$${Number(item.price).toFixed(2)}` : null,
      } as SearchDropdownItem,
      value: item.shopifyProductId,
    };
  }, []);

  return (
    <SearchDropdown
      value={value}
      onChange={onChange}
      fetch={authenticatedFetch}
      endpoint="/api/admin/products"
      mapItem={mapItem}
      placeholder={placeholder}
      emptyLabel="No products found"
    />
  );
}
