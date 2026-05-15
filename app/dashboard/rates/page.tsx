'use client';

import { useState, useEffect } from 'react';
import { Rates } from '@/components/RatesBar';

export default function RatesPage() {
  const [rates, setRates] = useState<Rates | null>(null);
  const [form, setForm] = useState({
    usd_to_aud: '',
    cny_to_aud: '',
    alibaba_fee_percent: '',
    usd_per_kg_worst_case: '',
  });
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/rates')
      .then((res) => res.json())
      .then((data: Rates) => {
        setRates(data);
        setForm({
          usd_to_aud: String(data.usd_to_aud),
          cny_to_aud: String(data.cny_to_aud),
          alibaba_fee_percent: String(data.alibaba_fee_percent * 100),
          usd_per_kg_worst_case: String(data.usd_per_kg_worst_case),
        });
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/rates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usd_to_aud: parseFloat(form.usd_to_aud),
          cny_to_aud: parseFloat(form.cny_to_aud),
          alibaba_fee_percent: parseFloat(form.alibaba_fee_percent) / 100,
          usd_per_kg_worst_case: parseFloat(form.usd_per_kg_worst_case),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setRates(data);
        setMessage('Rates saved and all products recalculated.');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    setMessage('');
    try {
      const res = await fetch('/api/rates/refresh', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setRates(data);
        setForm({
          usd_to_aud: String(data.usd_to_aud),
          cny_to_aud: String(data.cny_to_aud),
          alibaba_fee_percent: String(data.alibaba_fee_percent * 100),
          usd_per_kg_worst_case: String(data.usd_per_kg_worst_case),
        });
        setMessage('Live rates fetched and all products recalculated.');
      } else {
        setMessage('Failed to fetch live rates.');
      }
    } finally {
      setRefreshing(false);
    }
  }

  if (!rates) {
    return <div className="p-8 text-vault-muted">Loading rates...</div>;
  }

  const lastUpdated = rates.last_updated
    ? new Date(rates.last_updated).toLocaleString()
    : 'Never';

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold text-vault-text mb-2">
        Exchange Rates
      </h1>
      <p className="text-vault-muted text-sm mb-6">
        Last updated: {lastUpdated}
      </p>

      <form
        onSubmit={handleSave}
        className="bg-vault-card border border-vault-border rounded-vault p-6 space-y-4"
      >
        <div>
          <label className="block text-sm text-vault-muted mb-1">
            USD → AUD
          </label>
          <input
            type="number"
            step="0.0001"
            value={form.usd_to_aud}
            onChange={(e) =>
              setForm({ ...form, usd_to_aud: e.target.value })
            }
            className="w-full bg-vault-bg border border-vault-border rounded-lg px-3 py-2 text-vault-text focus:outline-none focus:border-vault-accent"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-vault-muted mb-1">
            CNY → AUD
          </label>
          <input
            type="number"
            step="0.0001"
            value={form.cny_to_aud}
            onChange={(e) =>
              setForm({ ...form, cny_to_aud: e.target.value })
            }
            className="w-full bg-vault-bg border border-vault-border rounded-lg px-3 py-2 text-vault-text focus:outline-none focus:border-vault-accent"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-vault-muted mb-1">
            Alibaba Fee %
          </label>
          <input
            type="number"
            step="0.1"
            value={form.alibaba_fee_percent}
            onChange={(e) =>
              setForm({ ...form, alibaba_fee_percent: e.target.value })
            }
            className="w-full bg-vault-bg border border-vault-border rounded-lg px-3 py-2 text-vault-text focus:outline-none focus:border-vault-accent"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-vault-muted mb-1">
            USD/kg Worst Case
          </label>
          <input
            type="number"
            step="0.1"
            value={form.usd_per_kg_worst_case}
            onChange={(e) =>
              setForm({ ...form, usd_per_kg_worst_case: e.target.value })
            }
            className="w-full bg-vault-bg border border-vault-border rounded-lg px-3 py-2 text-vault-text focus:outline-none focus:border-vault-accent"
            required
          />
        </div>

        {message && (
          <p className="text-vault-success text-sm">{message}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-4 py-2 bg-vault-accent hover:bg-vault-accent/80 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex-1 px-4 py-2 border border-vault-border rounded-lg text-vault-text hover:bg-vault-border/30 transition-colors disabled:opacity-50"
          >
            {refreshing ? 'Fetching...' : 'Auto-fetch Live Rates'}
          </button>
        </div>
      </form>
    </div>
  );
}
