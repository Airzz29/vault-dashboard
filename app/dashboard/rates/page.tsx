'use client';

import { useState, useEffect, Suspense } from 'react';
import TopBar from '@/components/TopBar';
import { ExchangeRates, ShippingRate } from '@/lib/db';
import { interpolateShippingUsd } from '@/lib/calculations';
import { useToast } from '@/hooks/useToast';
import ErrorBoundary from '@/components/ErrorBoundary';

function RatesContent() {
  const { showToast } = useToast();
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [shipping, setShipping] = useState<ShippingRate[]>([]);
  const [form, setForm] = useState({ usd_to_aud: '', cny_to_aud: '', alibaba_fee_percent: '', usd_per_kg_worst_case: '' });
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingShipping, setEditingShipping] = useState<Record<number, Partial<ShippingRate>>>({});
  const [lastFetchMins, setLastFetchMins] = useState<number | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    const [rRes, sRes] = await Promise.all([fetch('/api/rates'), fetch('/api/shipping')]);
    const rJson = await rRes.json();
    const sJson = await sRes.json();
    if (rJson.success) {
      setRates(rJson.data);
      setForm({
        usd_to_aud: String(rJson.data.usd_to_aud),
        cny_to_aud: String(rJson.data.cny_to_aud),
        alibaba_fee_percent: String(rJson.data.alibaba_fee_percent * 100),
        usd_per_kg_worst_case: String(rJson.data.usd_per_kg_worst_case),
      });
      if (rJson.data.last_updated) {
        const mins = Math.floor((Date.now() - new Date(rJson.data.last_updated).getTime()) / 60000);
        setLastFetchMins(mins);
      }
    }
    if (sJson.success) setShipping(sJson.data);
  }

  async function handleSaveRates(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
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
      const json = await res.json();
      if (json.success) {
        setRates(json.data);
        showToast('✓ Rates updated', 'success');
      } else showToast('✗ Error saving', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch('/api/rates/refresh', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setRates(json.data);
        setForm({
          usd_to_aud: String(json.data.usd_to_aud),
          cny_to_aud: String(json.data.cny_to_aud),
          alibaba_fee_percent: String(json.data.alibaba_fee_percent * 100),
          usd_per_kg_worst_case: String(json.data.usd_per_kg_worst_case),
        });
        setLastFetchMins(0);
        showToast('↻ Rates refreshed', 'success');
      }
    } finally {
      setRefreshing(false);
    }
  }

  async function saveShippingRow(id: number) {
    const patch = editingShipping[id];
    if (!patch) return;
    const res = await fetch(`/api/shipping/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const json = await res.json();
    if (json.success) {
      setShipping((prev) => prev.map((r) => (r.id === id ? json.data : r)));
      setEditingShipping((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      showToast('✓ Shipping rate saved', 'success');
    }
  }

  async function setBase(id: number) {
    const res = await fetch('/api/shipping/base', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ countryId: id }),
    });
    const json = await res.json();
    if (json.success) {
      setShipping(json.data);
      showToast('✓ Base country updated', 'success');
    }
  }

  const baseRate = shipping.find((s) => s.is_base_country === 1);
  const usdToAud = rates?.usd_to_aud ?? 1.38;

  function surchargeVsAus(rate: ShippingRate, weight = 1): number {
    if (!baseRate) return 0;
    const aus = interpolateShippingUsd(weight, baseRate) * usdToAud;
    const country = interpolateShippingUsd(weight, rate) * usdToAud;
    return country - aus;
  }

  const rateWarning = rates && (rates.usd_to_aud < 1 || rates.usd_to_aud > 2);

  if (!rates) {
    return (
      <>
        <TopBar title="Exchange Rates" breadcrumb="Rates" />
        <div className="p-8 text-vault-muted">Loading rates...</div>
      </>
    );
  }

  return (
    <>
      <TopBar title="Exchange Rates" breadcrumb="Rates / Shipping configuration" />
      <div className="flex-1 overflow-auto p-6 space-y-8 page-enter max-w-5xl">
        {rateWarning && (
          <div className="bg-vault-warning/10 border border-vault-warning/30 text-vault-warning px-4 py-3 rounded-vault text-sm">
            Warning: USD→AUD rate seems unusual ({rates.usd_to_aud}). Verify before saving.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'USD → AUD', value: rates.usd_to_aud.toFixed(4), icon: '🇺🇸' },
            { label: 'CNY → AUD', value: rates.cny_to_aud.toFixed(4), icon: '🇨🇳' },
            { label: 'Alibaba Fee', value: `${(rates.alibaba_fee_percent * 100).toFixed(1)}%`, icon: '🏭' },
            { label: 'USD/kg (legacy)', value: rates.usd_per_kg_worst_case.toFixed(1), icon: '📦' },
          ].map((card) => (
            <div key={card.label} className="bg-vault-card border border-vault-border rounded-vault p-5 flex items-center gap-4">
              <span className="text-2xl">{card.icon}</span>
              <div>
                <p className="text-vault-muted text-sm">{card.label}</p>
                <p className="text-xl font-semibold text-vault-text">{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSaveRates} className="bg-vault-card border border-vault-border rounded-vault p-6 space-y-4">
          <h2 className="font-semibold text-vault-text">Edit Exchange Rates</h2>
          <div className="grid grid-cols-2 gap-4">
            {(['usd_to_aud', 'cny_to_aud', 'alibaba_fee_percent', 'usd_per_kg_worst_case'] as const).map((key) => (
              <div key={key}>
                <label className="block text-sm text-vault-muted mb-1">{key.replace(/_/g, ' ')}</label>
                <input
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full bg-vault-bg border border-vault-border rounded-lg px-3 py-2 text-vault-text text-sm focus:outline-none focus:border-vault-accent"
                />
              </div>
            ))}
          </div>
          <p className="text-vault-muted text-xs">
            Last updated: {rates.last_updated ? new Date(rates.last_updated).toLocaleString() : 'Never'}
            {lastFetchMins !== null && ` · Last fetched: ${lastFetchMins} mins ago`}
          </p>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-vault-accent hover:bg-vault-accent-hover text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <span className="spinner" />}
              Save Changes
            </button>
            <button type="button" onClick={handleRefresh} disabled={refreshing} className="flex-1 px-4 py-2.5 border border-vault-border rounded-lg text-vault-text hover:bg-vault-card-hover disabled:opacity-50 flex items-center justify-center gap-2">
              <span className={refreshing ? 'animate-[spin_0.6s_linear_infinite]' : ''}>↻</span>
              {refreshing ? 'Fetching...' : 'Auto-fetch Live Rates'}
            </button>
          </div>
        </form>

        <div className="bg-vault-card border border-vault-border rounded-vault overflow-hidden">
          <div className="px-5 py-4 border-b border-vault-border flex items-center justify-between">
            <h2 className="font-semibold">Shipping Rates by Country</h2>
            <span className="text-xs text-vault-muted">Surcharge vs Australia @ 1kg</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-vault-muted border-b border-vault-border bg-vault-bg">
                  <th className="px-4 py-3 text-left">Country</th>
                  <th className="px-4 py-3 text-left">Express Line</th>
                  <th className="px-4 py-3 text-left">1kg USD</th>
                  <th className="px-4 py-3 text-left">2kg USD</th>
                  <th className="px-4 py-3 text-left">3kg USD</th>
                  <th className="px-4 py-3 text-left">Surcharge AUD</th>
                  <th className="px-4 py-3 text-left">Base</th>
                  <th className="px-4 py-3 text-left"></th>
                </tr>
              </thead>
              <tbody>
                {shipping.map((row) => {
                  const edit = editingShipping[row.id] ?? {};
                  const isBase = row.is_base_country === 1;
                  return (
                    <tr key={row.id} className={`border-b border-vault-border/50 ${isBase ? 'bg-vault-accent/10' : ''}`}>
                      <td className="px-4 py-3 font-medium">{row.country}</td>
                      <td className="px-4 py-3 text-vault-muted text-xs max-w-[140px]">{row.express_name}</td>
                      {(['rate_1kg_usd', 'rate_2kg_usd', 'rate_3kg_usd'] as const).map((field) => (
                        <td key={field} className="px-4 py-3">
                          <input
                            type="number"
                            step="0.01"
                            defaultValue={row[field]}
                            onChange={(e) =>
                              setEditingShipping((prev) => ({
                                ...prev,
                                [row.id]: { ...prev[row.id], [field]: parseFloat(e.target.value) },
                              }))
                            }
                            className="w-16 bg-vault-bg border border-vault-border rounded px-2 py-1 text-xs focus:outline-none focus:border-vault-accent"
                          />
                        </td>
                      ))}
                      <td className="px-4 py-3 text-vault-muted">
                        ${surchargeVsAus(row).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        {isBase ? (
                          <span className="text-vault-accent text-xs font-medium">Base</span>
                        ) : (
                          <button type="button" onClick={() => setBase(row.id)} className="text-xs text-vault-muted hover:text-vault-accent">
                            Set base
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingShipping[row.id] && (
                          <button type="button" onClick={() => saveShippingRow(row.id)} className="text-xs text-vault-accent hover:underline">
                            Save
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export default function RatesPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="p-8 text-vault-muted">Loading...</div>}>
        <RatesContent />
      </Suspense>
    </ErrorBoundary>
  );
}
