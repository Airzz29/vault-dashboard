'use client';

import { Product } from '@/lib/db';
import { formatCurrency, formatPercent, formatQty } from '@/lib/calculations';

const STATUSES = ['In Stock', 'Low Stock', 'Out of Stock', 'Discontinued'];

interface ProductTableProps {
  products: Product[];
  headerBg: string;
  headerLabel: string;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
}

function ValueCell({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-vault-warning">TBD</span>;
  }
  return <span>{formatCurrency(value)}</span>;
}

export default function ProductTable({
  products,
  headerBg,
  headerLabel,
  onEdit,
  onDelete,
  onStatusChange,
}: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="mb-8">
        <div
          className={`${headerBg} px-4 py-2 rounded-t-vault text-vault-gold font-semibold text-sm`}
        >
          {headerLabel}
        </div>
        <div className="bg-vault-card border border-vault-border border-t-0 rounded-b-vault px-4 py-8 text-center text-vault-muted text-sm">
          No products
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div
        className={`${headerBg} px-4 py-2 rounded-t-vault text-vault-gold font-semibold text-sm`}
      >
        {headerLabel}
      </div>
      <div className="overflow-x-auto bg-vault-card border border-vault-border border-t-0 rounded-b-vault">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-vault-border text-vault-muted text-left">
              <th className="px-4 py-3 font-medium">Item Name</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Qty</th>
              <th className="px-4 py-3 font-medium">Buy Price AUD</th>
              <th className="px-4 py-3 font-medium">Shipping Buffer</th>
              <th className="px-4 py-3 font-medium">Sale Price</th>
              <th className="px-4 py-3 font-medium">Net Profit</th>
              <th className="px-4 py-3 font-medium">Margin %</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr
                key={p.id}
                className="border-b border-vault-border/50 hover:bg-vault-border/20 transition-colors"
              >
                <td className="px-4 py-3 text-vault-text font-medium">
                  {p.name}
                </td>
                <td className="px-4 py-3 text-vault-muted">{p.category}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      p.fulfillment_type === 'Physical'
                        ? 'bg-vault-physical/50 text-blue-300'
                        : 'bg-vault-dropship/50 text-green-300'
                    }`}
                  >
                    {p.fulfillment_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-vault-text">
                  {formatQty(p.qty)}
                </td>
                <td className="px-4 py-3">
                  <ValueCell value={p.buy_price_aud} />
                </td>
                <td className="px-4 py-3 text-vault-muted">
                  {formatCurrency(p.shipping_buffer_aud)}
                </td>
                <td className="px-4 py-3 text-vault-text">
                  {formatCurrency(p.sale_price_aud)}
                </td>
                <td className="px-4 py-3">
                  {p.net_profit_aud === null ? (
                    <span className="text-vault-warning">TBD</span>
                  ) : (
                    <span className="text-vault-success">
                      {formatCurrency(p.net_profit_aud)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {p.margin_percent === null ? (
                    <span className="text-vault-warning">TBD</span>
                  ) : (
                    <span className="text-vault-success">
                      {formatPercent(p.margin_percent)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={p.status}
                    onChange={(e) => onStatusChange(p.id, e.target.value)}
                    className="bg-vault-bg border border-vault-border rounded px-2 py-1 text-xs text-vault-text focus:outline-none focus:border-vault-accent"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(p)}
                      className="text-vault-muted hover:text-vault-accent transition-colors"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDelete(p.id)}
                      className="text-vault-muted hover:text-vault-danger transition-colors"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
