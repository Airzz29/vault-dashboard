'use client';

import {
  ModalProfitBreakdown,
  formatBreakdownValue,
  getProfitColorClass,
} from '@/lib/calculations';

interface ProfitBreakdownCardProps {
  breakdown: ModalProfitBreakdown;
  feePercent: number;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-vault-muted">{label}</span>
      <span className="text-vault-text font-mono">{value}</span>
    </div>
  );
}

export default function ProfitBreakdownCard({
  breakdown,
  feePercent,
}: ProfitBreakdownCardProps) {
  const profitClass = breakdown.canCalculate
    ? getProfitColorClass(breakdown.net_profit_aud)
    : 'text-vault-muted';

  const showWarning =
    breakdown.canCalculate &&
    breakdown.net_profit_aud !== null &&
    breakdown.net_profit_aud < 40;

  return (
    <div className="space-y-3">
      {showWarning && (
        <div className="bg-vault-warning/10 border border-vault-warning/40 text-vault-warning text-sm px-3 py-2 rounded-lg">
          ⚠ Below $40 profit target — consider raising the sale price
        </div>
      )}
      <div className="bg-vault-tooltip border border-vault-border rounded-xl p-4">
        <p className="text-xs font-semibold text-vault-muted uppercase tracking-wider mb-3">
          Profit Breakdown
        </p>
        <div className="space-y-1.5">
          <Row
            label="Buy Cost (AUD)"
            value={formatBreakdownValue(breakdown.buy_price_aud)}
          />
          <Row
            label="Australia Shipping"
            value={formatBreakdownValue(breakdown.aus_shipping_aud)}
          />
          <Row
            label="Global Surcharge"
            value={formatBreakdownValue(breakdown.global_surcharge_aud)}
          />
          <Row
            label={`Platform Fee (${(feePercent * 100).toFixed(0)}%)`}
            value={formatBreakdownValue(breakdown.platform_fee_aud)}
          />
          <hr className="border-vault-border my-2" />
          <Row
            label="Total Cost"
            value={formatBreakdownValue(breakdown.total_cost_aud)}
          />
          <Row
            label="Sale Price"
            value={formatBreakdownValue(breakdown.sale_price_aud)}
          />
          <hr className="border-vault-border my-2" />
          <div className="flex justify-between items-center pt-1">
            <span className="text-vault-text font-medium">Net Profit</span>
            <span className={`text-xl font-bold font-mono ${profitClass}`}>
              {formatBreakdownValue(breakdown.net_profit_aud)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-vault-muted text-sm">Margin</span>
            <span className={`text-sm font-mono ${profitClass}`}>
              {breakdown.margin_percent !== null && breakdown.canCalculate
                ? formatBreakdownValue(breakdown.margin_percent, false)
                : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
