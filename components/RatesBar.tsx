'use client';

import { useState } from 'react';

export interface Rates {
  usd_to_aud: number;
  cny_to_aud: number;
  alibaba_fee_percent: number;
  usd_per_kg_worst_case: number;
  last_updated: string | null;
}

interface RatesBarProps {
  rates: Rates;
  onRatesUpdated: (rates: Rates) => void;
}

export default function RatesBar({ rates, onRatesUpdated }: RatesBarProps) {
  const [updating, setUpdating] = useState(false);

  async function handleRefresh() {
    setUpdating(true);
    try {
      const res = await fetch('/api/rates/refresh', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        onRatesUpdated(data);
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
      <span className="text-vault-muted font-medium">Exchange Rates:</span>
      <span>
        <span className="text-vault-muted">USD→AUD </span>
        <span className="text-vault-text font-mono">{rates.usd_to_aud.toFixed(4)}</span>
      </span>
      <span>
        <span className="text-vault-muted">CNY→AUD </span>
        <span className="text-vault-text font-mono">{rates.cny_to_aud.toFixed(4)}</span>
      </span>
      <span>
        <span className="text-vault-muted">Fee </span>
        <span className="text-vault-text font-mono">
          {(rates.alibaba_fee_percent * 100).toFixed(1)}%
        </span>
      </span>
      <span className="text-vault-muted text-xs">Updated: {lastUpdated}</span>
      <button
        onClick={handleRefresh}
        disabled={updating}
        className="ml-auto px-3 py-1 bg-vault-accent hover:bg-vault-accent/80 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        {updating ? 'Updating...' : 'Update Rates'}
      </button>
    </div>
  );
}
