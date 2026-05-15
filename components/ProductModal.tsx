'use client';

import { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import ProfitBreakdownCard from './ProfitBreakdownCard';
import {
  calculateModalProfitBreakdown,
  formatCurrency,
} from '@/lib/calculations';
import { ExchangeRates, ShippingRate } from '@/lib/db';

const CATEGORIES = ['Shoes', 'Hoodies', 'Shirts', 'Pants', 'Shorts', 'Jeans', 'Accessories'];
const STATUSES = [
  { value: 'In Stock', color: 'bg-vault-success' },
  { value: 'Low Stock', color: 'bg-vault-warning' },
  { value: 'Out of Stock', color: 'bg-vault-danger' },
  { value: 'Discontinued', color: 'bg-vault-muted' },
];
const WEIGHT_PRESETS = [0.2, 0.4, 0.6, 0.7, 0.9, 1.0];

export interface ProductFormData {
  id?: number;
  name: string;
  category: string;
  fulfillment_type: string;
  qty: number;
  buy_price_cny: number | null;
  buy_price_aud: number | null;
  is_aud_direct: number;
  estimated_weight_kg: number;
  sale_price_aud: number;
  status: string;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProductFormData) => Promise<void>;
  product?: ProductFormData | null;
  exchangeRates?: ExchangeRates | null;
  shippingRates?: ShippingRate[];
}

const emptyForm: ProductFormData = {
  name: '',
  category: 'Shoes',
  fulfillment_type: 'Physical',
  qty: 1,
  buy_price_cny: null,
  buy_price_aud: null,
  is_aud_direct: 0,
  estimated_weight_kg: 0.5,
  sale_price_aud: 0,
  status: 'In Stock',
};

export default function ProductModal({
  isOpen,
  onClose,
  onSave,
  product,
  exchangeRates: exchangeRatesProp,
  shippingRates: shippingRatesProp,
}: ProductModalProps) {
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [salePriceInput, setSalePriceInput] = useState('');
  const [audDirect, setAudDirect] = useState(false);
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [modalRates, setModalRates] = useState<ExchangeRates | null>(null);
  const [modalShipping, setModalShipping] = useState<ShippingRate[]>([]);
  const [ratesLoading, setRatesLoading] = useState(false);

  const exchangeRates = modalRates ?? exchangeRatesProp ?? null;
  const shippingRates = useMemo(
    () => (modalShipping.length > 0 ? modalShipping : shippingRatesProp ?? []),
    [modalShipping, shippingRatesProp]
  );

  useEffect(() => {
    if (!isOpen) return;
    setRatesLoading(true);
    Promise.all([fetch('/api/rates'), fetch('/api/shipping')])
      .then(async ([rRes, sRes]) => {
        const rJson = await rRes.json();
        const sJson = await sRes.json();
        if (rJson.success) setModalRates(rJson.data);
        if (sJson.success) setModalShipping(sJson.data);
      })
      .finally(() => setRatesLoading(false));
  }, [isOpen]);

  useEffect(() => {
    if (product) {
      setForm(product);
      setSalePriceInput(product.sale_price_aud ? String(product.sale_price_aud) : '');
      setAudDirect(product.is_aud_direct === 1);
    } else {
      setForm(emptyForm);
      setSalePriceInput('');
      setAudDirect(false);
    }
    setErrors({});
  }, [product, isOpen]);

  const isDropship = form.fulfillment_type === 'Dropship';

  const salePriceAud =
    salePriceInput.trim() !== '' ? parseFloat(salePriceInput) : null;

  const breakdown = useMemo(() => {
    if (!exchangeRates || shippingRates.length === 0) return null;
    return calculateModalProfitBreakdown(
      {
        buy_price_cny: audDirect ? null : form.buy_price_cny,
        buy_price_aud: audDirect ? form.buy_price_aud : null,
        is_aud_direct: audDirect ? 1 : 0,
        estimated_weight_kg: form.estimated_weight_kg,
        sale_price_aud: salePriceAud,
      },
      {
        usd_to_aud: exchangeRates.usd_to_aud,
        cny_to_aud: exchangeRates.cny_to_aud,
        alibaba_fee_percent: exchangeRates.alibaba_fee_percent,
      },
      shippingRates
    );
  }, [form, audDirect, salePriceAud, exchangeRates, shippingRates]);

  const convertedAud =
    exchangeRates && form.buy_price_cny != null
      ? form.buy_price_cny * exchangeRates.cny_to_aud
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, boolean> = {};
    if (!form.name.trim()) newErrors.name = true;
    if (!salePriceInput.trim() || !salePriceAud || salePriceAud <= 0) {
      newErrors.sale_price_aud = true;
    }
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    setSaving(true);
    try {
      await onSave({
        ...form,
        sale_price_aud: salePriceAud!,
        is_aud_direct: audDirect ? 1 : 0,
        qty: isDropship ? -1 : form.qty,
        buy_price_cny: audDirect ? null : form.buy_price_cny,
        buy_price_aud: audDirect ? form.buy_price_aud : null,
      });
      setClosing(true);
      setTimeout(() => {
        setClosing(false);
        onClose();
      }, 200);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Edit Product' : 'Add Product'}
      maxWidth="max-w-[520px]"
      closing={closing}
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-6"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 's') {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
      >
        <section>
          <h3 className="text-xs font-semibold text-vault-muted uppercase tracking-wider mb-3">
            Item Info
          </h3>
          <div className="space-y-3">
            <Field label="Name" error={errors.name}>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass(errors.name)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category">
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className={inputClass()}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Fulfillment">
                <div className="flex rounded-lg border border-vault-border overflow-hidden">
                  {['Physical', 'Dropship'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, fulfillment_type: t })}
                      className={`flex-1 py-2 text-xs font-medium transition-colors ${
                        form.fulfillment_type === t
                          ? 'bg-vault-accent text-white'
                          : 'text-vault-muted hover:bg-vault-card-hover'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </div>
        </section>

        <hr className="border-vault-border" />

        <section>
          <h3 className="text-xs font-semibold text-vault-muted uppercase tracking-wider mb-3">
            Pricing
          </h3>
          <label className="flex items-center gap-2 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={audDirect}
              onChange={(e) => setAudDirect(e.target.checked)}
              className="rounded accent-vault-accent"
            />
            <span className="text-sm text-vault-muted">Enter in AUD directly</span>
          </label>
          {audDirect ? (
            <Field label="Buy Price AUD">
              <input
                type="number"
                step="0.01"
                value={form.buy_price_aud ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    buy_price_aud: e.target.value
                      ? parseFloat(e.target.value)
                      : null,
                  })
                }
                className={inputClass()}
                placeholder="TBD if empty"
              />
            </Field>
          ) : (
            <Field label="Buy Price CNY 🇨🇳">
              <input
                type="number"
                step="0.01"
                value={form.buy_price_cny ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    buy_price_cny: e.target.value
                      ? parseFloat(e.target.value)
                      : null,
                  })
                }
                className={inputClass()}
                placeholder="Leave empty for TBD"
              />
              {convertedAud !== null && (
                <p className="text-xs text-vault-muted mt-1">
                  ≈ {formatCurrency(convertedAud)} AUD
                </p>
              )}
            </Field>
          )}
          <Field label="Sale Price AUD" error={errors.sale_price_aud}>
            <input
              type="number"
              step="0.01"
              value={salePriceInput}
              onChange={(e) => {
                setSalePriceInput(e.target.value);
                setForm({
                  ...form,
                  sale_price_aud: e.target.value
                    ? parseFloat(e.target.value)
                    : 0,
                });
              }}
              className={inputClass(errors.sale_price_aud)}
              required
            />
          </Field>
          <Field label="Est. Weight (kg)">
            <div className="flex flex-wrap gap-2 mb-2">
              {WEIGHT_PRESETS.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setForm({ ...form, estimated_weight_kg: w })}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    form.estimated_weight_kg === w
                      ? 'border-vault-accent bg-vault-accent/20 text-vault-text'
                      : 'border-vault-border text-vault-muted hover:border-vault-accent'
                  }`}
                >
                  {w}kg
                </button>
              ))}
            </div>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={form.estimated_weight_kg}
              onChange={(e) =>
                setForm({
                  ...form,
                  estimated_weight_kg: parseFloat(e.target.value),
                })
              }
              className="w-full accent-vault-accent"
            />
            <p className="text-xs text-vault-muted text-center">
              {form.estimated_weight_kg} kg
            </p>
          </Field>
        </section>

        <hr className="border-vault-border" />

        <section>
          <h3 className="text-xs font-semibold text-vault-muted uppercase tracking-wider mb-3">
            Settings
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {!isDropship && (
              <Field label="Qty">
                <input
                  type="number"
                  min="0"
                  value={form.qty}
                  onChange={(e) =>
                    setForm({ ...form, qty: parseInt(e.target.value, 10) || 0 })
                  }
                  className={inputClass()}
                />
              </Field>
            )}
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className={inputClass()}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.value}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        {ratesLoading ? (
          <p className="text-vault-muted text-sm text-center py-4">
            Loading rates...
          </p>
        ) : breakdown ? (
          <ProfitBreakdownCard
            breakdown={breakdown}
            feePercent={exchangeRates?.alibaba_fee_percent ?? 0.03}
          />
        ) : null}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-vault-border rounded-lg text-vault-muted hover:text-vault-text transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-vault-accent hover:bg-vault-accent-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <span className="spinner" />}
            {product ? 'Save Changes' : 'Add Product'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: boolean;
}) {
  return (
    <div className="mb-3">
      <label className="block text-sm text-vault-muted mb-1">{label}</label>
      <div className={error ? 'animate-shake' : ''}>{children}</div>
    </div>
  );
}

function inputClass(error?: boolean) {
  return `w-full bg-vault-bg border rounded-lg px-3 py-2 text-vault-text text-sm focus:outline-none focus:border-vault-accent transition-colors ${
    error ? 'border-vault-danger' : 'border-vault-border'
  }`;
}
