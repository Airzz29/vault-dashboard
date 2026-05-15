'use client';

import { Product } from '@/lib/db';
import {
  formatCurrency,
  formatPercent,
  getProfitColorClass,
  isTbdBuyPrice,
} from '@/lib/calculations';

interface ProductTooltipProps {
  product: Product;
  x: number;
  y: number;
  feePercent: number;
}

export default function ProductTooltip({
  product,
  x,
  y,
  feePercent,
}: ProductTooltipProps) {
  const tbd = isTbdBuyPrice(
    product.buy_price_cny,
    product.buy_price_aud,
    product.is_aud_direct
  );

  return (
    <div
      className="fixed z-50 pointer-events-none animate-scale-in"
      style={{ left: x + 16, top: y - 8 }}
    >
      <div className="bg-vault-tooltip border border-vault-border rounded-xl p-4 min-w-[220px] shadow-xl text-sm">
        <p className="text-vault-muted text-xs mb-3 font-medium">
          {product.name}
        </p>
        <div className="space-y-1.5 text-vault-muted">
          <Row label="Buy Cost (AUD)" value={formatCurrency(product.buy_price_aud)} tbd={tbd} />
          <Row label="Australia Shipping" value={formatCurrency(product.shipping_buffer_aud)} />
          <Row label="Global Surcharge" value={formatCurrency(product.global_surcharge_aud)} />
          <Row
            label={`Platform Fee (${(feePercent * 100).toFixed(0)}%)`}
            value={formatCurrency(product.platform_fee_aud)}
            tbd={product.platform_fee_aud === null}
          />
          <Row label="Total Cost" value={formatCurrency(product.total_cost_aud)} tbd={product.total_cost_aud === null} />
          <Row label="Sale Price" value={formatCurrency(product.sale_price_aud)} />
        </div>
        <hr className="border-vault-border my-3" />
        <p className={`text-lg font-bold ${getProfitColorClass(product.net_profit_aud)}`}>
          {formatCurrency(product.net_profit_aud)}
        </p>
        <p className={`text-xs ${getProfitColorClass(product.net_profit_aud)}`}>
          Margin {formatPercent(product.margin_percent)}
        </p>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  tbd,
}: {
  label: string;
  value: string;
  tbd?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span>{label}</span>
      <span className={tbd ? 'text-vault-warning italic' : 'text-vault-text'}>
        {value}
      </span>
    </div>
  );
}
