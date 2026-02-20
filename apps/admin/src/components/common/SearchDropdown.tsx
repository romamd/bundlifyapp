import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface SearchDropdownItem {
  id: string;
  label: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  detail?: string | null;
}

interface SearchDropdownProps {
  value: string;
  onChange: (value: string) => void;
  fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  endpoint: string;
  /** Map API response items to dropdown items. Also returns the value to store. */
  mapItem: (item: any) => { item: SearchDropdownItem; value: string };
  placeholder?: string;
  emptyLabel?: string;
}

export function SearchDropdown({
  value,
  onChange,
  fetch: authenticatedFetch,
  endpoint,
  mapItem,
  placeholder = 'Search...',
  emptyLabel = 'No results found',
}: SearchDropdownProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Array<{ item: SearchDropdownItem; value: string }>>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const pageSize = 10;

  const fetchItems = useCallback(
    async (query: string, pageNum: number, append: boolean) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(pageNum),
          pageSize: String(pageSize),
        });
        if (query.trim()) {
          params.set('search', query.trim());
        }
        const res = await authenticatedFetch(`${endpoint}?${params}`);
        if (res.ok) {
          const data = await res.json();
          const rawItems: any[] = data.items || data;
          const count = data.total ?? rawItems.length;
          const mapped = rawItems.map(mapItem);
          setResults((prev) => (append ? [...prev, ...mapped] : mapped));
          setTotal(count);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    },
    [authenticatedFetch, endpoint, mapItem],
  );

  // Debounced search
  useEffect(() => {
    if (!open) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchItems(search, 1, false);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, open, fetchItems]);

  // Load more
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchItems(search, nextPage, true);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Resolve label for pre-selected value
  useEffect(() => {
    if (value && !selectedLabel) {
      authenticatedFetch(`${endpoint}?search=&page=1&pageSize=50`)
        .then((r) => r.json())
        .then((data) => {
          const rawItems: any[] = data.items || data;
          const mapped = rawItems.map(mapItem);
          const match = mapped.find((m) => m.value === value);
          if (match) {
            setSelectedLabel(match.item.label);
          } else {
            setSelectedLabel(value);
          }
        })
        .catch(() => setSelectedLabel(value));
    }
  }, [value, selectedLabel, authenticatedFetch, endpoint, mapItem]);

  const handleSelect = (entry: { item: SearchDropdownItem; value: string }) => {
    setSelectedLabel(entry.item.label);
    onChange(entry.value);
    setOpen(false);
    setSearch('');
  };

  const hasMore = results.length < total;

  return (
    <div ref={containerRef} style={{ position: 'relative', flex: 1 }}>
      {open ? (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          autoFocus
          style={{
            width: '100%',
            padding: '6px 8px',
            border: '1px solid #008060',
            borderRadius: '4px',
            fontSize: '13px',
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />
      ) : (
        <div
          onClick={() => setOpen(true)}
          style={{
            padding: '6px 8px',
            border: '1px solid #c9cccf',
            borderRadius: '4px',
            fontSize: '13px',
            cursor: 'pointer',
            backgroundColor: '#ffffff',
            color: value ? '#202223' : '#6d7175',
            minHeight: '20px',
          }}
        >
          {selectedLabel || placeholder}
        </div>
      )}

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 100,
            backgroundColor: '#ffffff',
            border: '1px solid #c9cccf',
            borderRadius: '0 0 4px 4px',
            maxHeight: '240px',
            overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        >
          {loading && results.length === 0 && (
            <div style={{ padding: '10px 12px', fontSize: '13px', color: '#6d7175' }}>
              Loading...
            </div>
          )}
          {!loading && results.length === 0 && (
            <div style={{ padding: '10px 12px', fontSize: '13px', color: '#6d7175' }}>
              {emptyLabel}
            </div>
          )}
          {results.map((entry) => (
            <div
              key={entry.item.id}
              onClick={() => handleSelect(entry)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '13px',
                borderBottom: '1px solid #f1f1f1',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: entry.value === value ? '#f1f8f5' : '#ffffff',
              }}
              onMouseEnter={(e) => {
                if (entry.value !== value) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#f6f6f7';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  entry.value === value ? '#f1f8f5' : '#ffffff';
              }}
            >
              {entry.item.imageUrl && (
                <img
                  src={entry.item.imageUrl}
                  alt=""
                  style={{
                    width: '28px',
                    height: '28px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {entry.item.label}
                </div>
                {entry.item.subtitle && (
                  <div style={{ fontSize: '11px', color: '#6d7175' }}>
                    {entry.item.subtitle}
                  </div>
                )}
              </div>
              {entry.item.detail && (
                <div style={{ fontSize: '12px', color: '#6d7175', flexShrink: 0 }}>
                  {entry.item.detail}
                </div>
              )}
            </div>
          ))}
          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={loading}
              style={{
                width: '100%',
                padding: '8px',
                border: 'none',
                backgroundColor: '#f6f6f7',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                color: '#008060',
                fontWeight: 500,
              }}
            >
              {loading ? 'Loading...' : `Load more (${results.length} of ${total})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
