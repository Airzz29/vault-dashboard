'use client';

import { useState, useEffect, Suspense } from 'react';
import TopBar from '@/components/TopBar';
import { formatCurrency, formatPercent } from '@/lib/calculations';
import { KpiSkeleton } from '@/components/Skeleton';
import ErrorBoundary from '@/components/ErrorBoundary';

interface DashboardData {
  kpis: {
    totalProducts: number;
    totalCostAud: number;
    totalRevenueAud: number;
    totalNetProfitAud: number;
    avgMarginPercent: number;
    tbdCount: number;
    avgProfit: number;
  };
  profitHealth: { onTarget: number; watch: number; belowTarget: number };
  fulfillment: { type: string; count: number; revenue: number; profit: number }[];
  categories: { category: string; count: number; avgMargin: number | null; profit: number }[];
}

const CATEGORY_COLORS: Record<string, string> = {
  Shoes: '#7c3aed',
  Hoodies: '#a78bfa',
  Shirts: '#60a5fa',
  Pants: '#4ade80',
  Shorts: '#fbbf24',
  Jeans: '#f87171',
  Accessories: '#c9a84c',
};

function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const duration = 800;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      setDisplay(value * progress);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <>{format(display)}</>;
}

function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setData(j.data);
        setLoading(false);
      });
  }, []);

  const totalRevenue = data?.fulfillment.reduce((s, f) => s + f.revenue, 0) ?? 1;

  const kpis = data
    ? [
        { label: 'Total Products', value: data.kpis.totalProducts, format: (n: number) => String(Math.round(n)), icon: '📦', accent: 'border-t-vault-accent' },
        { label: 'Total Cost AUD', value: data.kpis.totalCostAud, format: formatCurrency, icon: '💸', accent: 'border-t-vault-muted' },
        { label: 'Total Revenue AUD', value: data.kpis.totalRevenueAud, format: formatCurrency, icon: '📈', accent: 'border-t-vault-gold' },
        { label: 'Net Profit AUD', value: data.kpis.totalNetProfitAud, format: formatCurrency, icon: '💰', accent: 'border-t-vault-success', profit: true },
        { label: 'Avg Margin %', value: data.kpis.avgMarginPercent, format: formatPercent, icon: '📊', accent: 'border-t-vault-success', profit: true },
      ]
    : [];

  return (
    <>
      <TopBar title="Summary Dashboard" breadcrumb="Dashboard / Overview" />
      <div className="flex-1 overflow-auto p-6 space-y-8 page-enter">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => <KpiSkeleton key={i} />)}
          </div>
        ) : data ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {kpis.map((kpi, i) => (
                <div
                  key={kpi.label}
                  style={{ animationDelay: `${i * 80}ms` }}
                  className={`bg-vault-card border border-vault-border ${kpi.accent} border-t-2 rounded-vault p-5 animate-fade-in relative`}
                >
                  <span className="absolute top-4 right-4 text-xl opacity-50">{kpi.icon}</span>
                  <p className="text-vault-muted text-sm mb-2">{kpi.label}</p>
                  <p className={`text-2xl font-bold ${kpi.profit ? 'text-vault-success' : 'text-vault-text'}`}>
                    <AnimatedNumber value={kpi.value} format={kpi.format} />
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'On Target (>$50)', count: data.profitHealth.onTarget, color: 'text-vault-success border-vault-success/30' },
                { label: 'Watch ($20–49)', count: data.profitHealth.watch, color: 'text-vault-warning border-vault-warning/30' },
                { label: 'Below Target (<$20)', count: data.profitHealth.belowTarget, color: 'text-vault-danger border-vault-danger/30' },
              ].map((b) => (
                <div key={b.label} className={`bg-vault-card border rounded-vault p-5 ${b.color}`}>
                  <p className="text-sm text-vault-muted mb-1">Profit Health</p>
                  <p className="text-3xl font-bold">{b.count}</p>
                  <p className="text-xs mt-1">{b.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-vault-card border border-vault-border rounded-vault overflow-hidden">
                <div className="px-5 py-3 border-b border-vault-border">
                  <h2 className="font-semibold">Fulfillment Breakdown</h2>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-vault-muted border-b border-vault-border">
                      <th className="px-5 py-3 text-left">Type</th>
                      <th className="px-5 py-3 text-left">Items</th>
                      <th className="px-5 py-3 text-left">Revenue</th>
                      <th className="px-5 py-3 text-left">Profit</th>
                      <th className="px-5 py-3 text-left w-24">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.fulfillment.map((row) => (
                      <tr key={row.type} className="border-b border-vault-border/50">
                        <td className="px-5 py-3">{row.type}</td>
                        <td className="px-5 py-3 text-vault-muted">{row.count}</td>
                        <td className="px-5 py-3">{formatCurrency(row.revenue)}</td>
                        <td className="px-5 py-3 text-vault-success">{formatCurrency(row.profit)}</td>
                        <td className="px-5 py-3">
                          <div className="h-2 bg-vault-border rounded-full overflow-hidden">
                            <div className="h-full bg-vault-accent rounded-full" style={{ width: `${(row.revenue / totalRevenue) * 100}%` }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-vault-card border border-vault-border rounded-vault overflow-hidden">
                <div className="px-5 py-3 border-b border-vault-border">
                  <h2 className="font-semibold">Category Breakdown</h2>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-vault-muted border-b border-vault-border">
                      <th className="px-5 py-3 text-left">Category</th>
                      <th className="px-5 py-3 text-left">Items</th>
                      <th className="px-5 py-3 text-left">Avg Margin</th>
                      <th className="px-5 py-3 text-left">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.categories.map((row) => {
                      const maxProfit = Math.max(...data.categories.map((c) => c.profit), 1);
                      return (
                        <tr key={row.category} className="border-b border-vault-border/50">
                          <td className="px-5 py-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[row.category] ?? '#71717a' }} />
                            {row.category}
                          </td>
                          <td className="px-5 py-3 text-vault-muted">{row.count}</td>
                          <td className="px-5 py-3 text-vault-success">
                            {row.avgMargin === null ? <span className="text-vault-warning italic">TBD</span> : formatPercent(row.avgMargin)}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-vault-border rounded-full overflow-hidden">
                                <div className="h-full bg-vault-success rounded-full" style={{ width: `${(row.profit / maxProfit) * 100}%` }} />
                              </div>
                              <span className="text-vault-success text-xs">{formatCurrency(row.profit)}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <p className="text-vault-muted">Failed to load dashboard</p>
        )}
      </div>
    </>
  );
}

export default function SummaryDashboardPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="p-8 text-vault-muted">Loading...</div>}>
        <DashboardContent />
      </Suspense>
    </ErrorBoundary>
  );
}
