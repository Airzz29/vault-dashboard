'use client';

import { useState, useRef } from 'react';
import { Product } from '@/lib/db';
import {
  formatCurrency,
  formatPercent,
  formatQty,
  getProfitColorClass,
  getMarginColorClass,
  isTbdBuyPrice,
} from '@/lib/calculations';
import ProductTooltip from './ProductTooltip';
import { TableSkeleton } from './Skeleton';

const STATUSES = ['In Stock', 'Low Stock', 'Out of Stock', 'Discontinued'];

interface ProductTableProps {
  products: Product[];
  headerBg: string;
  headerLabel: string;
  count: number;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onStatusChange: (id: number, status: string) => void;
  deletingIds: Set<number>;
  loading?: boolean;
  feePercent: number;
}

export default function ProductTable({
  products,
  headerBg,
  headerLabel,
  count,
  onEdit,
  onDelete,
  onStatusChange,
  deletingIds,
  loading,
  feePercent,
}: ProductTableProps) {
  const [tooltip, setTooltip] = useState<{
    product: Product;
    x: number;
    y: number;
  } | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>();

  function handleMouseEnter(e: React.MouseEvent, product: Product) {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      setTooltip({ product, x: e.clientX, y: e.clientY });
    }, 400);
  }

  function handleMouseLeave() {
    clearTimeout(hoverTimer.current);
    setTooltip(null);
  }

  if (loading) {
    return (
      <div className="mb-8">
        <div className={`${headerBg} px-4 py-2 rounded-t-vault text-vault-gold font-semibold text-sm flex items-center gap-2`}>
          {headerLabel}
        </div>
        <div className="bg-vault-card border border-vault-border border-t-0 rounded-b-vault">
          <TableSkeleton />
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="mb-8">
      <div className={`${headerBg} px-4 py-2.5 rounded-t-vault text-vault-gold font-semibold text-sm flex items-center gap-2`}>
        {headerLabel}
        <span className="bg-black/30 text-vault-text text-xs px-2 py-0.5 rounded-full font-normal">
          {count}
        </span>
      </div>
      <div className="overflow-x-auto bg-vault-card border border-vault-border border-t-0 rounded-b-vault">
        <table className="w-full text-sm min-w-[1100px]">
          <thead className="sticky top-0 z-10 bg-vault-card">
            <tr className="border-b border-vault-border text-vault-muted text-left">
              <th className="px-4 py-3 font-medium sticky left-0 bg-vault-card z-20">Item Name</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Qty</th>
              <th className="px-4 py-3 font-medium">Buy AUD</th>
              <th className="px-4 py-3 font-medium">Shipping</th>
              <th className="px-4 py-3 font-medium">Surcharge</th>
              <th className="px-4 py-3 font-medium">Sale</th>
              <th className="px-4 py-3 font-medium">Profit</th>
              <th className="px-4 py-3 font-medium">Margin</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => {
              const tbd = isTbdBuyPrice(p.buy_price_cny, p.buy_price_aud, p.is_aud_direct);
              const deleting = deletingIds.has(p.id);
              return (
                <tr
                  key={p.id}
                  style={{ animationDelay: `${i * 30}ms` }}
                  className={`border-b border-vault-border/50 transition-all duration-200 animate-slide-in hover:bg-vault-card-hover group ${
                    tbd ? 'border-l-[3px] border-l-vault-warning bg-vault-warning/5' : ''
                  } ${deleting ? 'animate-[fadeOut_0.3s_ease_forwards] overflow-hidden' : ''}`}
                  onMouseEnter={(e) => handleMouseEnter(e, p)}
                  onMouseLeave={handleMouseLeave}
                >
                  <td className="px-4 py-3 text-vault-text font-medium sticky left-0 bg-inherit group-hover:bg-vault-card-hover z-[5]">
                    {p.name}
                  </td>
                  <td className="px-4 py-3 text-vault-muted">{p.category}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      p.fulfillment_type === 'Physical'
                        ? 'bg-vault-physical/20 text-vault-physical'
                        : 'bg-vault-dropship/20 text-vault-dropship'
                    }`}>
                      {p.fulfillment_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatQty(p.qty)}</td>
                  <td className="px-4 py-3">
                    {tbd ? <span className="text-vault-warning italic">TBD</span> : formatCurrency(p.buy_price_aud)}
                  </td>
                  <td className="px-4 py-3 text-vault-muted">{formatCurrency(p.shipping_buffer_aud)}</td>
                  <td className="px-4 py-3 text-vault-muted text-xs">{formatCurrency(p.global_surcharge_aud)}</td>
                  <td className="px-4 py-3">{formatCurrency(p.sale_price_aud)}</td>
                  <td className={`px-4 py-3 font-medium ${getProfitColorClass(p.net_profit_aud)}`}>
                    {tbd || p.net_profit_aud === null ? <span className="text-vault-warning italic">TBD</span> : formatCurrency(p.net_profit_aud)}
                  </td>
                  <td className={`px-4 py-3 ${getMarginColorClass(p.margin_percent)}`}>
                    {tbd || p.margin_percent === null ? <span className="text-vault-warning italic">TBD</span> : formatPercent(p.margin_percent)}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={p.status}
                      onChange={(e) => onStatusChange(p.id, e.target.value)}
                      className="bg-vault-bg border border-vault-border rounded px-2 py-1 text-xs text-vault-text focus:outline-none focus:border-vault-accent"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => onEdit(p)} className="hover:text-vault-accent" title="Edit">✏️</button>
                      <button type="button" onClick={() => onDelete(p)} className="hover:text-vault-danger" title="Delete">🗑️</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {tooltip && (
        <ProductTooltip product={tooltip.product} x={tooltip.x} y={tooltip.y} feePercent={feePercent} />
      )}
    </div>
  );
}
