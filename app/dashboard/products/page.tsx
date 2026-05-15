'use client';

import { useState, useEffect, useCallback } from 'react';
import RatesBar, { Rates } from '@/components/RatesBar';
import ProductTable from '@/components/ProductTable';
import ProductModal, { ProductFormData } from '@/components/ProductModal';
import { Product } from '@/lib/db';

type Tab = 'all' | 'physical' | 'dropship';

export default function ProductsPage() {
  const [physical, setPhysical] = useState<Product[]>([]);
  const [dropship, setDropship] = useState<Product[]>([]);
  const [rates, setRates] = useState<Rates | null>(null);
  const [tab, setTab] = useState<Tab>('all');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductFormData | null>(
    null
  );

  const loadData = useCallback(async () => {
    const [productsRes, ratesRes] = await Promise.all([
      fetch('/api/products'),
      fetch('/api/rates'),
    ]);
    if (productsRes.ok) {
      const data = await productsRes.json();
      setPhysical(data.physical);
      setDropship(data.dropship);
    }
    if (ratesRes.ok) {
      setRates(await ratesRes.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const allCount = physical.length + dropship.length;

  const showPhysical = tab === 'all' || tab === 'physical';
  const showDropship = tab === 'all' || tab === 'dropship';

  const filteredPhysical =
    tab === 'dropship' ? [] : physical;
  const filteredDropship =
    tab === 'physical' ? [] : dropship;

  async function handleSave(data: ProductFormData) {
    if (data.id) {
      await fetch(`/api/products/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } else {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    }
    await loadData();
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this product?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    await loadData();
  }

  async function handleStatusChange(id: number, status: string) {
    await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await loadData();
  }

  function handleEdit(product: Product) {
    setEditingProduct({
      id: product.id,
      name: product.name,
      category: product.category,
      fulfillment_type: product.fulfillment_type,
      qty: product.qty,
      buy_price_cny: product.buy_price_cny,
      buy_price_aud: product.buy_price_aud,
      is_aud_direct: product.is_aud_direct,
      estimated_weight_kg: product.estimated_weight_kg,
      sale_price_aud: product.sale_price_aud,
      status: product.status,
    });
    setModalOpen(true);
  }

  function handleAdd() {
    setEditingProduct(null);
    setModalOpen(true);
  }

  if (loading) {
    return (
      <div className="p-8 text-vault-muted">Loading inventory...</div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-vault-text">
          Inventory Tracker
        </h1>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-vault-accent hover:bg-vault-accent/80 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Add Product
        </button>
      </div>

      {rates && (
        <RatesBar rates={rates} onRatesUpdated={(r) => setRates(r)} />
      )}

      <div className="flex gap-2">
        {(
          [
            { key: 'all', label: `All (${allCount})` },
            { key: 'physical', label: `Physical (${physical.length})` },
            { key: 'dropship', label: `Dropship (${dropship.length})` },
          ] as { key: Tab; label: string }[]
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === key
                ? 'bg-vault-accent text-white'
                : 'bg-vault-card border border-vault-border text-vault-muted hover:text-vault-text'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {showPhysical && (
        <ProductTable
          products={filteredPhysical}
          headerBg="bg-vault-physical"
          headerLabel="PHYSICAL INVENTORY"
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      )}

      {showDropship && (
        <ProductTable
          products={filteredDropship}
          headerBg="bg-vault-dropship"
          headerLabel="DROPSHIP CATALOG"
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      )}

      <ProductModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSave}
        product={editingProduct}
      />
    </div>
  );
}
