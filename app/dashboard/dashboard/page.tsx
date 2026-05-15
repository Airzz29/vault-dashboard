'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, formatPercent } from '@/lib/calculations';

interface DashboardData {
  kpis: {
    totalProducts: number;
    totalCostAud: number;
    totalRevenueAud: number;
    totalNetProfitAud: number;
    avgMarginPercent: number;
  };
  fulfillment: {
    type: string;
    count: number;
    revenue: number;
    profit: number;
  }[];
  categories: {
    category: string;
    count: number;
    avgMargin: number | null;
  }[];
}

export default function SummaryDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="p-8 text-vault-muted">Loading dashboard...</div>
    );
  }

  const kpis = [
    { label: 'Total Products', value: String(data.kpis.totalProducts) },
    {
      label: 'Total Cost AUD',
      value: formatCurrency(data.kpis.totalCostAud),
    },
    {
      label: 'Total Revenue AUD',
      value: formatCurrency(data.kpis.totalRevenueAud),
    },
    {
      label: 'Total Net Profit AUD',
      value: formatCurrency(data.kpis.totalNetProfitAud),
      profit: true,
    },
    {
      label: 'Avg Margin %',
      value: formatPercent(data.kpis.avgMarginPercent),
      profit: true,
    },
  ];

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-vault-text">Summary Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-vault-card border border-vault-border rounded-vault p-5"
          >
            <p className="text-vault-muted text-sm mb-1">{kpi.label}</p>
            <p
              className={`text-2xl font-bold ${
                kpi.profit ? 'text-vault-success' : 'text-vault-text'
              }`}
            >
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-vault-card border border-vault-border rounded-vault overflow-hidden">
          <div className="px-5 py-3 border-b border-vault-border">
            <h2 className="font-semibold text-vault-text">
              Fulfillment Breakdown
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-vault-muted border-b border-vault-border">
                <th className="px-5 py-3 text-left font-medium">Type</th>
                <th className="px-5 py-3 text-left font-medium">Items</th>
                <th className="px-5 py-3 text-left font-medium">Revenue</th>
                <th className="px-5 py-3 text-left font-medium">Profit</th>
              </tr>
            </thead>
            <tbody>
              {data.fulfillment.map((row) => (
                <tr
                  key={row.type}
                  className="border-b border-vault-border/50"
                >
                  <td className="px-5 py-3 text-vault-text">{row.type}</td>
                  <td className="px-5 py-3 text-vault-muted">{row.count}</td>
                  <td className="px-5 py-3 text-vault-text">
                    {formatCurrency(row.revenue)}
                  </td>
                  <td className="px-5 py-3 text-vault-success">
                    {formatCurrency(row.profit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-vault-card border border-vault-border rounded-vault overflow-hidden">
          <div className="px-5 py-3 border-b border-vault-border">
            <h2 className="font-semibold text-vault-text">
              Category Breakdown
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-vault-muted border-b border-vault-border">
                <th className="px-5 py-3 text-left font-medium">Category</th>
                <th className="px-5 py-3 text-left font-medium">Items</th>
                <th className="px-5 py-3 text-left font-medium">Avg Margin</th>
              </tr>
            </thead>
            <tbody>
              {data.categories.map((row) => (
                <tr
                  key={row.category}
                  className="border-b border-vault-border/50"
                >
                  <td className="px-5 py-3 text-vault-text">{row.category}</td>
                  <td className="px-5 py-3 text-vault-muted">{row.count}</td>
                  <td className="px-5 py-3">
                    {row.avgMargin === null ? (
                      <span className="text-vault-warning">TBD</span>
                    ) : (
                      <span className="text-vault-success">
                        {formatPercent(row.avgMargin)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
