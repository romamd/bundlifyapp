import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface RevenueDataPoint {
  date: string;
  revenue: number;
  margin: number;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
}

function formatDollar(value: number): string {
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function RevenueChart({ data }: RevenueChartProps) {
  if (data.length === 0) {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          color: '#6d7175',
          fontSize: '14px',
          border: '1px solid #e1e3e5',
          borderRadius: '8px',
        }}
      >
        No revenue data available for this period.
      </div>
    );
  }

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
        Revenue & Margin Over Time
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e1e3e5" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: '#6d7175' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6d7175' }}
            tickFormatter={formatDollar}
            tickLine={false}
          />
          <Tooltip
            formatter={(value: unknown, name: unknown) => [
              formatDollar(Number(value) || 0),
              String(name) === 'revenue' ? 'Revenue' : 'Margin',
            ]}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e1e3e5',
              fontSize: '13px',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '13px' }}
            formatter={(value: string) =>
              value === 'revenue' ? 'Revenue' : 'Margin'
            }
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#4c6ef5"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="margin"
            stroke="#008060"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
