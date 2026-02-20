import React, { useCallback } from 'react';
import { SearchDropdown, type SearchDropdownItem } from './SearchDropdown';

interface CollectionSearchDropdownProps {
  value: string;
  onChange: (handle: string) => void;
  fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  placeholder?: string;
}

export function CollectionSearchDropdown({
  value,
  onChange,
  fetch: authenticatedFetch,
  placeholder = 'Search collections...',
}: CollectionSearchDropdownProps) {
  const mapItem = useCallback((item: any) => {
    return {
      item: {
        id: item.id || item.handle,
        label: item.title,
        subtitle: item.handle,
        imageUrl: item.imageUrl,
        detail: item.productsCount != null ? `${item.productsCount} products` : null,
      } as SearchDropdownItem,
      value: item.handle,
    };
  }, []);

  return (
    <SearchDropdown
      value={value}
      onChange={onChange}
      fetch={authenticatedFetch}
      endpoint="/api/admin/collections"
      mapItem={mapItem}
      placeholder={placeholder}
      emptyLabel="No collections found"
    />
  );
}
