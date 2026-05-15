'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';

const CATEGORIES = [
  'Shoes',
  'Hoodies',
  'Shirts',
  'Pants',
  'Shorts',
  'Jeans',
  'Accessories',
];

const STATUSES = ['In Stock', 'Low Stock', 'Out of Stock', 'Discontinued'];

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
}: ProductModalProps) {
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [audDirect, setAudDirect] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setForm(product);
      setAudDirect(product.is_aud_direct === 1);
    } else {
      setForm(emptyForm);
      setAudDirect(false);
    }
  }, [product, isOpen]);

  const isDropship = form.fulfillment_type === 'Dropship';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...form,
        is_aud_direct: audDirect ? 1 : 0,
        qty: isDropship ? -1 : form.qty,
        buy_price_cny: audDirect ? null : form.buy_price_cny,
        buy_price_aud: audDirect ? form.buy_price_aud : null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Edit Product' : 'Add Product'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-vault-muted mb-1">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-vault-bg border border-vault-border rounded-lg px-3 py-2 text-vault-text focus:outline-none focus:border-vault-accent"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-vault-muted mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full bg-vault-bg border border-vault-border rounded-lg px-3 py-2 text-vault-text focus:outline-none focus:border-vault-accent"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-vault-muted mb-1">
              Fulfillment
            </label>
            <select
              value={form.fulfillment_type}
              onChange={(e) =>
                setForm({ ...form, fulfillment_type: e.target.value })
              }
              className="w-full bg-vault-bg border border-vault-border rounded-lg px-3 py-2 text-vault-text focus:outline-none focus:border-vault-accent"
            >
              <option value="Physical">Physical</option>
              <option value="Dropship">Dropship</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="audDirect"
            checked={audDirect}
            onChange={(e) => setAudDirect(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="audDirect" className="text-sm text-vault-muted">
            Enter buy price in AUD directly
          </label>
        </div>
        {audDirect ? (
          <div>
            <label className="block text-sm text-vault-muted mb-1">
              Buy Price AUD
            </label>
            <input
              type="number"
              step="0.01"
              value={form.buy_price_aud ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  buy_price_aud: e.target.value ? parseFloat(e.target.value) : null,
                })
              }
              className="w-full bg-vault-bg border border-vault-border rounded-lg px-3 py-2 text-vault-text focus:outline-none focus:border-vault-accent"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm text-vault-muted mb-1">
              Buy Price CNY
            </label>
            <input
              type="number"
              step="0.01"
              value={form.buy_price_cny ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  buy_price_cny: e.target.value ? parseFloat(e.target.value) : null,
                })
              }
              placeholder="Leave empty for TBD"
              className="w-full bg-vault-bg border border-vault-border rounded-lg px-3 py-2 text-vault-text focus:outline-none focus:border-vault-accent"
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-vault-muted mb-1">
              Sale Price AUD
            </label>
            <input
              type="number"
              step="0.01"
              value={form.sale_price_aud}
              onChange={(e) =>
                setForm({
                  ...form,
                  sale_price_aud: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full bg-vault-bg border border-vault-border rounded-lg px-3 py-2 text-vault-text focus:outline-none focus:border-vault-accent"
              required
            />
          </div>
          {!isDropship && (
            <div>
              <label className="block text-sm text-vault-muted mb-1">Qty</label>
              <input
                type="number"
                min="0"
                value={form.qty}
                onChange={(e) =>
                  setForm({ ...form, qty: parseInt(e.target.value, 10) || 0 })
                }
                className="w-full bg-vault-bg border border-vault-border rounded-lg px-3 py-2 text-vault-text focus:outline-none focus:border-vault-accent"
                required
              />
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-vault-muted mb-1">
              Est. Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={form.estimated_weight_kg}
              onChange={(e) =>
                setForm({
                  ...form,
                  estimated_weight_kg: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full bg-vault-bg border border-vault-border rounded-lg px-3 py-2 text-vault-text focus:outline-none focus:border-vault-accent"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-vault-muted mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full bg-vault-bg border border-vault-border rounded-lg px-3 py-2 text-vault-text focus:outline-none focus:border-vault-accent"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="bg-vault-success/10 border border-vault-success/30 rounded-lg px-4 py-3 text-sm text-vault-success">
          Buy Price AUD, shipping buffer, fees, profit and margin auto-calculate
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-vault-border rounded-lg text-vault-muted hover:text-vault-text transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-4 py-2 bg-vault-accent hover:bg-vault-accent/80 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : product ? 'Save Changes' : 'Add Product'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
