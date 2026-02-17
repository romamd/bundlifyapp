import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';

interface FunnelChartProps {
  views: number;
  clicks: number;
  addToCarts: number;
  purchases: number;
}

const COLORS = ['#4c6ef5', '#228be6', '#008060', '#1a5632'];

function formatRate(current: number, previous: number): string {
  if (previous === 0) return '0%';
  return `${((current / previous) * 100).toFixed(1)}%`;
}

export function FunnelChart({
  views,
  clicks,
  addToCarts,
  purchases,
}: FunnelChartProps) {
  const data = [
    { name: 'Views', value: views, rate: '' },
    {
      name: 'Clicks',
      value: clicks,
      rate: formatRate(clicks, views),
    },
    {
      name: 'Add to Cart',
      value: addToCarts,
      rate: formatRate(addToCarts, clicks),
    },
    {
      name: 'Purchases',
      value: purchases,
      rate: formatRate(purchases, addToCarts),
    },
  ];

  return (
    <div
      style={{
        border: '1px solid #e1e3e5',
        borderRadius: '8px',
        padding: '16px',
        backgroundColor: '#ffffff',
      }}
    >
      <h3
        style={{
          fontSize: '14px',
          fontWeight: 600,
          margin: '0 0 16px 0',
        }}
      >
        Bundle Conversion Funnel
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 80, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e1e3e5" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 12, fill: '#6d7175' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 13, fill: '#202223' }}
            tickLine={false}
            width={90}
          />
          <Tooltip
            formatter={(value: unknown) => [Number(value).toLocaleString(), 'Count']}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e1e3e5',
              fontSize: '13px',
            }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
            <LabelList
              dataKey="value"
              position="right"
              formatter={(value: unknown) => Number(value).toLocaleString()}
              style={{ fontSize: '12px', fill: '#202223' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Conversion rates between stages */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          marginTop: '12px',
          padding: '8px 0',
          borderTop: '1px solid #f1f1f1',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6d7175' }}>
            Click Rate
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#228be6' }}>
            {formatRate(clicks, views)}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6d7175' }}>
            Cart Rate
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#008060' }}>
            {formatRate(addToCarts, clicks)}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6d7175' }}>
            Purchase Rate
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#1a5632' }}>
            {formatRate(purchases, addToCarts)}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6d7175' }}>
            Overall
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#4c6ef5' }}>
            {formatRate(purchases, views)}
          </div>
        </div>
      </div>
    </div>
  );
}
