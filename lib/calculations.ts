export interface ExchangeRatesInput {
  usd_to_aud: number;
  cny_to_aud: number;
  alibaba_fee_percent: number;
}

export interface ShippingRateInput {
  id: number;
  country: string;
  express_name: string;
  rate_1kg_usd: number;
  rate_2kg_usd: number;
  rate_3kg_usd: number;
  is_base_country: number;
}

export interface ProductInput {
  buy_price_cny: number | null;
  buy_price_aud: number | null;
  is_aud_direct: number;
  estimated_weight_kg: number;
  sale_price_aud: number;
  qty: number;
}

export interface ShippingResult {
  aus_shipping_aud: number;
  worst_case_aud: number;
  global_surcharge_aud: number;
  shipping_buffer_aud: number;
}

export interface ProductCalculated {
  buy_price_aud: number | null;
  shipping_buffer_aud: number;
  global_surcharge_aud: number;
  platform_fee_aud: number | null;
  total_cost_aud: number | null;
  revenue_aud: number;
  net_profit_aud: number | null;
  margin_percent: number | null;
}

export function interpolateShippingUsd(
  weightKg: number,
  rate: Pick<ShippingRateInput, 'rate_1kg_usd' | 'rate_2kg_usd' | 'rate_3kg_usd'>
): number {
  const { rate_1kg_usd, rate_2kg_usd, rate_3kg_usd } = rate;
  if (weightKg <= 1) {
    return (weightKg / 1) * rate_1kg_usd;
  }
  if (weightKg <= 2) {
    return rate_1kg_usd + (weightKg - 1) * (rate_2kg_usd - rate_1kg_usd);
  }
  return rate_2kg_usd + (weightKg - 2) * (rate_3kg_usd - rate_2kg_usd);
}

export function calculateShipping(
  weightKg: number,
  shippingRates: ShippingRateInput[],
  usdToAud: number
): ShippingResult {
  const baseRate = shippingRates.find((r) => r.is_base_country === 1);
  if (!baseRate) {
    throw new Error('No base country shipping rate configured');
  }

  const worstCaseRate = shippingRates.reduce((worst, r) =>
    r.rate_1kg_usd > worst.rate_1kg_usd ? r : worst
  );

  const ausUsd = interpolateShippingUsd(weightKg, baseRate);
  const worstUsd = interpolateShippingUsd(weightKg, worstCaseRate);

  const aus_shipping_aud = ausUsd * usdToAud;
  const worst_case_aud = worstUsd * usdToAud;
  const global_surcharge_aud = worst_case_aud - aus_shipping_aud;
  const shipping_buffer_aud = aus_shipping_aud;

  return {
    aus_shipping_aud,
    worst_case_aud,
    global_surcharge_aud,
    shipping_buffer_aud,
  };
}

export function calculateBuyPriceAud(
  input: Pick<ProductInput, 'buy_price_cny' | 'buy_price_aud' | 'is_aud_direct'>,
  rates: ExchangeRatesInput
): number | null {
  if (input.is_aud_direct === 1) {
    return input.buy_price_aud;
  }
  if (input.buy_price_cny !== null && input.buy_price_cny !== undefined) {
    return input.buy_price_cny * rates.cny_to_aud;
  }
  return null;
}

export function calculateProduct(
  input: ProductInput,
  exchangeRates: ExchangeRatesInput,
  shippingRates: ShippingRateInput[]
): ProductCalculated {
  const buyPriceAud = calculateBuyPriceAud(input, exchangeRates);

  const shipping = calculateShipping(
    input.estimated_weight_kg,
    shippingRates,
    exchangeRates.usd_to_aud
  );

  let platformFeeAud: number | null = null;
  if (buyPriceAud !== null) {
    platformFeeAud = buyPriceAud * exchangeRates.alibaba_fee_percent;
  }

  let totalCostAud: number | null = null;
  if (buyPriceAud !== null && platformFeeAud !== null) {
    const unitCost =
      buyPriceAud + shipping.shipping_buffer_aud + platformFeeAud;
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
    shipping_buffer_aud: shipping.shipping_buffer_aud,
    global_surcharge_aud: shipping.global_surcharge_aud,
    platform_fee_aud: platformFeeAud,
    total_cost_aud: totalCostAud,
    revenue_aud: revenueAud,
    net_profit_aud: netProfitAud,
    margin_percent: marginPercent,
  };
}

export function getProfitColorClass(profit: number | null): string {
  if (profit === null) return 'text-vault-warning italic';
  if (profit >= 50) return 'text-vault-success';
  if (profit >= 20) return 'text-vault-warning';
  return 'text-vault-danger';
}

export function getMarginColorClass(marginPercent: number | null): string {
  if (marginPercent === null) return 'text-vault-warning italic';
  const pct = marginPercent * 100;
  if (pct >= 40) return 'text-vault-success';
  if (pct >= 20) return 'text-vault-warning';
  return 'text-vault-danger';
}

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'TBD';
  }
  return `$${value.toFixed(2)}`;
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'TBD';
  }
  return `${(value * 100).toFixed(1)}%`;
}

export function formatQty(qty: number): string {
  return qty === -1 ? '∞' : String(qty);
}

export function isTbdBuyPrice(
  buyPriceCny: number | null,
  buyPriceAud: number | null,
  isAudDirect: number
): boolean {
  if (isAudDirect === 1) return buyPriceAud === null;
  return buyPriceCny === null;
}

/** Per-unit profit preview for Add/Edit modal (surcharge informational, not in total cost). */
export interface ModalProfitBreakdown {
  buy_price_aud: number | null;
  aus_shipping_aud: number | null;
  global_surcharge_aud: number | null;
  platform_fee_aud: number | null;
  total_cost_aud: number | null;
  sale_price_aud: number | null;
  net_profit_aud: number | null;
  margin_percent: number | null;
  canCalculate: boolean;
}

export interface ModalProfitInput {
  buy_price_cny: number | null;
  buy_price_aud: number | null;
  is_aud_direct: number;
  estimated_weight_kg: number;
  sale_price_aud: number | null;
}

export function calculateModalProfitBreakdown(
  input: ModalProfitInput,
  exchangeRates: ExchangeRatesInput,
  shippingRates: ShippingRateInput[]
): ModalProfitBreakdown {
  const empty: ModalProfitBreakdown = {
    buy_price_aud: null,
    aus_shipping_aud: null,
    global_surcharge_aud: null,
    platform_fee_aud: null,
    total_cost_aud: null,
    sale_price_aud: null,
    net_profit_aud: null,
    margin_percent: null,
    canCalculate: false,
  };

  const salePrice =
    input.sale_price_aud !== null &&
    input.sale_price_aud !== undefined &&
    input.sale_price_aud > 0
      ? input.sale_price_aud
      : null;

  const shipping = calculateShipping(
    input.estimated_weight_kg,
    shippingRates,
    exchangeRates.usd_to_aud
  );

  const buyPriceAud = calculateBuyPriceAud(input, exchangeRates);

  if (buyPriceAud === null || salePrice === null) {
    return {
      ...empty,
      aus_shipping_aud: shipping.aus_shipping_aud,
      global_surcharge_aud: shipping.global_surcharge_aud,
      sale_price_aud: salePrice,
    };
  }

  const platformFeeAud = buyPriceAud * exchangeRates.alibaba_fee_percent;
  const totalCostAud =
    buyPriceAud + shipping.aus_shipping_aud + platformFeeAud;
  const netProfitAud = salePrice - totalCostAud;
  const marginPercent = salePrice > 0 ? netProfitAud / salePrice : null;

  return {
    buy_price_aud: buyPriceAud,
    aus_shipping_aud: shipping.aus_shipping_aud,
    global_surcharge_aud: shipping.global_surcharge_aud,
    platform_fee_aud: platformFeeAud,
    total_cost_aud: totalCostAud,
    sale_price_aud: salePrice,
    net_profit_aud: netProfitAud,
    margin_percent: marginPercent,
    canCalculate: true,
  };
}

export function formatBreakdownValue(
  value: number | null | undefined,
  asCurrency = true
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  return asCurrency ? `$${value.toFixed(2)}` : `${(value * 100).toFixed(1)}%`;
}
