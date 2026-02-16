import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import type { BulkCogsRow } from '@bundlify/shared-types';

interface CogsCsvImportProps {
  onImport: (rows: BulkCogsRow[]) => Promise<{ matched: number; unmatched: number }>;
}

export function CogsCsvImport({ onImport }: CogsCsvImportProps) {
  const [rows, setRows] = useState<BulkCogsRow[]>([]);
  const [result, setResult] = useState<{ matched: number; unmatched: number } | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed: BulkCogsRow[] = [];

        for (const row of results.data as any[]) {
          if (!row.sku || !row.cogs) continue;

          parsed.push({
            sku: String(row.sku).trim(),
            cogs: parseFloat(row.cogs),
            ...(row.shippingCost && {
              shippingCost: parseFloat(row.shippingCost),
            }),
            ...(row.additionalCosts && {
              additionalCosts: parseFloat(row.additionalCosts),
            }),
          });
        }

        if (parsed.length === 0) {
          setError('No valid rows found. CSV must have "sku" and "cogs" columns.');
          return;
        }

        setRows(parsed);
      },
      error: () => setError('Failed to parse CSV file'),
    });
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const importResult = await onImport(rows);
      setResult(importResult);
      setRows([]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{ padding: '16px', border: '1px solid #e1e3e5', borderRadius: '8px' }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Import COGS from CSV</h3>
      <p style={{ margin: '0 0 12px 0', color: '#6d7175', fontSize: '13px' }}>
        Upload a CSV with columns: sku, cogs, shippingCost (optional), additionalCosts (optional)
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        style={{ marginBottom: '12px' }}
      />

      {error && (
        <div style={{ color: '#8c1a1a', marginBottom: '12px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {rows.length > 0 && (
        <div>
          <p style={{ fontSize: '14px', marginBottom: '8px' }}>
            {rows.length} rows ready to import
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e1e3e5' }}>
                <th style={{ textAlign: 'left', padding: '4px 8px' }}>SKU</th>
                <th style={{ textAlign: 'right', padding: '4px 8px' }}>COGS</th>
                <th style={{ textAlign: 'right', padding: '4px 8px' }}>Shipping</th>
                <th style={{ textAlign: 'right', padding: '4px 8px' }}>Additional</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 5).map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f2f3' }}>
                  <td style={{ padding: '4px 8px' }}>{row.sku}</td>
                  <td style={{ textAlign: 'right', padding: '4px 8px' }}>${row.cogs.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '4px 8px' }}>
                    {row.shippingCost ? `$${row.shippingCost.toFixed(2)}` : '-'}
                  </td>
                  <td style={{ textAlign: 'right', padding: '4px 8px' }}>
                    {row.additionalCosts ? `$${row.additionalCosts.toFixed(2)}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 5 && (
            <p style={{ fontSize: '12px', color: '#6d7175' }}>
              ...and {rows.length - 5} more rows
            </p>
          )}

          <button
            onClick={handleImport}
            disabled={importing}
            style={{
              padding: '8px 20px',
              backgroundColor: '#008060',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {importing ? 'Importing...' : `Import ${rows.length} rows`}
          </button>
        </div>
      )}

      {result && (
        <div style={{ marginTop: '12px', padding: '8px 12px', backgroundColor: '#f1f8f5', borderRadius: '4px', fontSize: '14px' }}>
          Matched: <strong>{result.matched}</strong> products | Unmatched SKUs:{' '}
          <strong>{result.unmatched}</strong>
        </div>
      )}
    </div>
  );
}
