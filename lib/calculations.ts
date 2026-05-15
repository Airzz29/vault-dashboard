export interface Rates {
  usd_to_aud: number;
  cny_to_aud: number;
  alibaba_fee_percent: number;
  usd_per_kg_worst_case: number;
}

export interface ProductInput {
  buy_price_cny: number | null;
  buy_price_aud: number | null;
  is_aud_direct: number;
  estimated_weight_kg: number;
  sale_price_aud: number;
  qty: number;
}

export interface ProductCalculated {
  buy_price_aud: number | null;
  shipping_buffer_aud: number;
  platform_fee_aud: number | null;
  total_cost_aud: number | null;
  revenue_aud: number;
  net_profit_aud: number | null;
  margin_percent: number | null;
}

export function calculateProduct(
  input: ProductInput,
  rates: Rates
): ProductCalculated {
  let buyPriceAud: number | null = null;

  if (input.is_aud_direct === 1) {
    buyPriceAud = input.buy_price_aud;
  } else if (input.buy_price_cny !== null) {
    buyPriceAud = input.buy_price_cny * rates.cny_to_aud;
  }

  const shippingBufferAud =
    input.estimated_weight_kg * rates.usd_per_kg_worst_case * rates.usd_to_aud;

  let platformFeeAud: number | null = null;
  if (buyPriceAud !== null) {
    platformFeeAud = buyPriceAud * rates.alibaba_fee_percent;
  }

  let totalCostAud: number | null = null;
  if (buyPriceAud !== null && platformFeeAud !== null) {
    const unitCost = buyPriceAud + shippingBufferAud + platformFeeAud;
    const effectiveQty = input.qty === -1 ? 1 : input.qty;
    totalCostAud = unitCost * effectiveQty;
  }

  const effectiveQtyForRevenue = input.qty === -1 ? 1 : input.qty;
  const revenueAud = input.sale_price_aud * effectiveQtyForRevenue;

  let netProfitAud: number | null = null;
  if (totalCostAud !== null) {
    netProfitAud = revenueAud - totalCostAud;
  }

  let marginPercent: number | null = null;
  if (netProfitAud !== null && revenueAud > 0) {
    marginPercent = netProfitAud / revenueAud;
  }

  return {
    buy_price_aud: buyPriceAud,
    shipping_buffer_aud: shippingBufferAud,
    platform_fee_aud: platformFeeAud,
    total_cost_aud: totalCostAud,
    revenue_aud: revenueAud,
    net_profit_aud: netProfitAud,
    margin_percent: marginPercent,
  };
}

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'TBD';
  return `$${value.toFixed(2)}`;
}

export function formatPercent(value: number | null): string {
  if (value === null) return 'TBD';
  return `${(value * 100).toFixed(1)}%`;
}

export function formatQty(qty: number): string {
  return qty === -1 ? '∞' : String(qty);
}
