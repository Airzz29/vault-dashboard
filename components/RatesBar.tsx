'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { ExchangeRates } from '@/lib/db';

interface RatesBarProps {
  rates: ExchangeRates;
  onRatesUpdated: (rates: ExchangeRates) => void;
  onProductsRefresh?: () => void;
}

export default function RatesBar({
  rates,
  onRatesUpdated,
  onProductsRefresh,
}: RatesBarProps) {
  const [updating, setUpdating] = useState(false);
  const { showToast } = useToast();

  async function handleRefresh() {
    setUpdating(true);
    try {
      const res = await fetch('/api/rates/refresh', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        onRatesUpdated(json.data);
        onProductsRefresh?.();
        showToast('↻ Rates refreshed', 'success');
      } else {
        showToast('✗ Failed to refresh rates', 'error');
      }
    } finally {
      setUpdating(false);
    }
  }

  const lastUpdated = rates.last_updated
    ? new Date(rates.last_updated).toLocaleString()
    : 'Never';

  return (
    <div className="bg-vault-card border border-vault-border rounded-vault px-4 py-3 flex flex-wrap items-center gap-4 text-sm">
      <span className="text-vault-muted font-medium">Exchange Rates</span>
      <span><span className="text-vault-muted">USD→AUD </span><span className="font-mono text-vault-text">{rates.usd_to_aud.toFixed(4)}</span></span>
      <span><span className="text-vault-muted">CNY→AUD </span><span className="font-mono text-vault-text">{rates.cny_to_aud.toFixed(4)}</span></span>
      <span><span className="text-vault-muted">Fee </span><span className="font-mono text-vault-text">{(rates.alibaba_fee_percent * 100).toFixed(1)}%</span></span>
      <span className="text-vault-muted text-xs">Updated: {lastUpdated}</span>
      <button
        onClick={handleRefresh}
        disabled={updating}
        className="ml-auto px-3 py-1.5 bg-vault-accent hover:bg-vault-accent-hover text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
      >
        {updating && <span className="spinner" />}
        {updating ? 'Updating...' : 'Update Rates'}
      </button>
    </div>
  );
}
