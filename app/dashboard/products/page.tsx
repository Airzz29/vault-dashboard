'use client';

import { useState, useMemo, useEffect, useRef, useCallback, Suspense } from 'react';
import TopBar from '@/components/TopBar';
import RatesBar from '@/components/RatesBar';
import ProductTable from '@/components/ProductTable';
import ProductModal, { ProductFormData } from '@/components/ProductModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useProducts } from '@/hooks/useProducts';
import { Product, ExchangeRates, ShippingRate } from '@/lib/db';
import { formatCurrency, formatPercent, isTbdBuyPrice } from '@/lib/calculations';
import ErrorBoundary from '@/components/ErrorBoundary';

const CATEGORIES = ['All', 'Shoes', 'Hoodies', 'Shirts', 'Pants', 'Shorts', 'Jeans', 'Accessories'];
type FulfillmentTab = 'all' | 'physical' | 'dropship';
type SortKey = 'name' | 'profit' | 'margin' | 'sale' | 'buy';

function ProductsContent() {
  const {
    physical,
    dropship,
    allProducts,
    loading,
    deletingIds,
    fetchProducts,
    createProduct,
    updateProduct,
    updateStatus,
    deleteProduct,
  } = useProducts();

  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [tab, setTab] = useState<FulfillmentTab>('all');
  const [sort, setSort] = useState<SortKey>('name');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductFormData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/rates').then((r) => r.json()).then((j) => j.success && setRates(j.data));
    fetch('/api/shipping').then((r) => r.json()).then((j) => j.success && setShippingRates(j.data));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'n' && !modalOpen && document.activeElement?.tagName !== 'INPUT') {
        handleAdd();
      }
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setModalOpen(false);
        setDeleteTarget(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modalOpen]);

  const filterAndSort = useCallback(
    (list: Product[]) => {
      let filtered = list.filter((p) => {
        const matchSearch =
          !search ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.category.toLowerCase().includes(search.toLowerCase());
        const matchCat = category === 'All' || p.category === category;
        return matchSearch && matchCat;
      });

      filtered.sort((a, b) => {
        switch (sort) {
          case 'profit':
            return (b.net_profit_aud ?? -999) - (a.net_profit_aud ?? -999);
          case 'margin':
            return (b.margin_percent ?? -999) - (a.margin_percent ?? -999);
          case 'sale':
            return b.sale_price_aud - a.sale_price_aud;
          case 'buy':
            return (b.buy_price_aud ?? -999) - (a.buy_price_aud ?? -999);
          default:
            return a.name.localeCompare(b.name);
        }
      });
      return filtered;
    },
    [search, category, sort]
  );

  const filteredPhysical = useMemo(() => {
    if (tab === 'dropship') return [];
    return filterAndSort(physical);
  }, [physical, tab, filterAndSort]);

  const filteredDropship = useMemo(() => {
    if (tab === 'physical') return [];
    return filterAndSort(dropship);
  }, [dropship, tab, filterAndSort]);

  const displayed = useMemo(
    () => [...filteredPhysical, ...filteredDropship],
    [filteredPhysical, filteredDropship]
  );

  const stats = useMemo(() => {
    const profits = displayed
      .map((p) => p.net_profit_aud)
      .filter((v): v is number => v !== null);
    const margins = displayed
      .map((p) => p.margin_percent)
      .filter((v): v is number => v !== null);
    const tbd = displayed.filter((p) =>
      isTbdBuyPrice(p.buy_price_cny, p.buy_price_aud, p.is_aud_direct)
    ).length;
    return {
      total: displayed.length,
      tbd,
      avgProfit: profits.length ? profits.reduce((a, b) => a + b, 0) / profits.length : 0,
      avgMargin: margins.length ? margins.reduce((a, b) => a + b, 0) / margins.length : 0,
    };
  }, [displayed]);

  function handleAdd() {
    setEditingProduct(null);
    setModalOpen(true);
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

  async function handleSave(data: ProductFormData) {
    if (data.id) await updateProduct(data);
    else await createProduct(data);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await deleteProduct(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
  }

  return (
    <>
      <TopBar title="Inventory Tracker" breadcrumb="Products / All inventory" />
      <div className="flex-1 overflow-auto p-6 space-y-5 page-enter">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-vault-muted text-sm">Manage physical stock and dropship catalog</p>
          <button onClick={handleAdd} className="px-4 py-2 bg-vault-accent hover:bg-vault-accent-hover text-white text-sm font-medium rounded-lg transition-colors">
            + Add Product
          </button>
        </div>

        {rates && (
          <RatesBar rates={rates} onRatesUpdated={setRates} onProductsRefresh={fetchProducts} />
        )}

        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-vault-muted">🔍</span>
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or category..."
              className="w-full bg-vault-card border border-vault-border rounded-lg pl-9 pr-3 py-2 text-sm text-vault-text focus:outline-none focus:border-vault-accent"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="bg-vault-card border border-vault-border rounded-lg px-3 py-2 text-sm text-vault-text focus:outline-none focus:border-vault-accent"
          >
            <option value="name">Sort by Name</option>
            <option value="profit">Sort by Profit</option>
            <option value="margin">Sort by Margin</option>
            <option value="sale">Sort by Sale Price</option>
            <option value="buy">Sort by Buy Price</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                category === c ? 'bg-vault-accent text-white' : 'bg-vault-card border border-vault-border text-vault-muted hover:text-vault-text'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {([
            { key: 'all' as const, label: `All (${allProducts.length})` },
            { key: 'physical' as const, label: `Physical (${physical.length})` },
            { key: 'dropship' as const, label: `Dropship (${dropship.length})` },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === key ? 'bg-vault-accent text-white' : 'bg-vault-card border border-vault-border text-vault-muted hover:text-vault-text'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="text-vault-muted text-sm">Showing {stats.total} products</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Products', value: String(stats.total) },
            { label: 'Items with TBD', value: String(stats.tbd) },
            { label: 'Avg Profit', value: formatCurrency(stats.avgProfit) },
            { label: 'Avg Margin', value: formatPercent(stats.avgMargin) },
          ].map((s) => (
            <div key={s.label} className="bg-vault-card border border-vault-border rounded-vault px-4 py-3">
              <p className="text-vault-muted text-xs">{s.label}</p>
              <p className="text-vault-text font-semibold">{s.value}</p>
            </div>
          ))}
        </div>

        <ProductTable
          products={filteredPhysical}
          headerBg="bg-[#1e293b]"
          headerLabel="PHYSICAL INVENTORY"
          count={filteredPhysical.length}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
          onStatusChange={updateStatus}
          deletingIds={deletingIds}
          loading={loading}
          feePercent={rates?.alibaba_fee_percent ?? 0.03}
        />
        <ProductTable
          products={filteredDropship}
          headerBg="bg-[#14532d]"
          headerLabel="DROPSHIP CATALOG"
          count={filteredDropship.length}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
          onStatusChange={updateStatus}
          deletingIds={deletingIds}
          loading={loading}
          feePercent={rates?.alibaba_fee_percent ?? 0.03}
        />

        <ProductModal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setEditingProduct(null); }}
          onSave={handleSave}
          product={editingProduct}
          exchangeRates={rates}
          shippingRates={shippingRates}
        />

        <ConfirmDialog
          isOpen={!!deleteTarget}
          title="Delete product?"
          message={deleteTarget ? `Delete "${deleteTarget.name}"? This cannot be undone.` : ''}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      </div>
    </>
  );
}

export default function ProductsPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="p-8 text-vault-muted">Loading...</div>}>
        <ProductsContent />
      </Suspense>
    </ErrorBoundary>
  );
}
