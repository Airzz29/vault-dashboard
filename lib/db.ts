import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import {
  calculateProduct,
  ExchangeRatesInput,
  ShippingRateInput,
} from './calculations';

const DB_PATH =
  process.env.NODE_ENV === 'production'
    ? '/data/vault.db'
    : path.join(process.cwd(), 'data', 'vault.db');

let db: Database.Database | null = null;

const SHIPPING_SEED: Omit<ShippingRateInput, 'id'>[] = [
  { country: 'Australia', express_name: 'Australia Dedicated Line F', rate_1kg_usd: 12, rate_2kg_usd: 18, rate_3kg_usd: 26, is_base_country: 1 },
  { country: 'USA', express_name: 'USPS Small Parcel-F Box', rate_1kg_usd: 20, rate_2kg_usd: 36, rate_3kg_usd: 52, is_base_country: 0 },
  { country: 'UK', express_name: 'UK Dedicated Line Small Parcel F', rate_1kg_usd: 11, rate_2kg_usd: 20, rate_3kg_usd: 29, is_base_country: 0 },
  { country: 'Netherlands', express_name: 'Europe DHL Small Parcel F-H', rate_1kg_usd: 16, rate_2kg_usd: 25, rate_3kg_usd: 34, is_base_country: 0 },
  { country: 'France', express_name: 'Europe DHL Small Parcel F-H', rate_1kg_usd: 18, rate_2kg_usd: 27, rate_3kg_usd: 36, is_base_country: 0 },
  { country: 'Canada', express_name: 'Canada Dedicated Line Small Parcel F', rate_1kg_usd: 17, rate_2kg_usd: 30, rate_3kg_usd: 43, is_base_country: 0 },
];

function getDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initSchema(db);
    runMigrations(db);
    seedIfEmpty(db);
  }
  return db;
}

function columnExists(database: Database.Database, table: string, column: string): boolean {
  const cols = database.pragma(`table_info(${table})`) as { name: string }[];
  return cols.some((c) => c.name === column);
}

function initSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      fulfillment_type TEXT NOT NULL,
      qty INTEGER NOT NULL DEFAULT 1,
      buy_price_cny REAL,
      buy_price_aud REAL,
      shipping_buffer_aud REAL,
      platform_fee_aud REAL,
      total_cost_aud REAL,
      estimated_weight_kg REAL NOT NULL DEFAULT 0,
      sale_price_aud REAL NOT NULL DEFAULT 0,
      revenue_aud REAL,
      net_profit_aud REAL,
      margin_percent REAL,
      status TEXT DEFAULT 'In Stock',
      date_added TEXT,
      is_aud_direct INTEGER DEFAULT 0,
      global_surcharge_aud REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS exchange_rates (
      id INTEGER PRIMARY KEY DEFAULT 1,
      usd_to_aud REAL DEFAULT 1.38,
      cny_to_aud REAL DEFAULT 0.204,
      alibaba_fee_percent REAL DEFAULT 0.03,
      usd_per_kg_worst_case REAL DEFAULT 20,
      last_updated TEXT
    );

    CREATE TABLE IF NOT EXISTS shipping_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      country TEXT NOT NULL,
      express_name TEXT NOT NULL,
      rate_1kg_usd REAL NOT NULL,
      rate_2kg_usd REAL NOT NULL,
      rate_3kg_usd REAL NOT NULL,
      is_base_country INTEGER DEFAULT 0
    );
  `);

  if (!columnExists(database, 'products', 'global_surcharge_aud')) {
    database.exec(`ALTER TABLE products ADD COLUMN global_surcharge_aud REAL DEFAULT 0`);
  }

  const ratesCount = database
    .prepare('SELECT COUNT(*) as c FROM exchange_rates')
    .get() as { c: number };
  if (ratesCount.c === 0) {
    database
      .prepare(
        `INSERT INTO exchange_rates (id, usd_to_aud, cny_to_aud, alibaba_fee_percent, usd_per_kg_worst_case, last_updated)
         VALUES (1, 1.38, 0.204, 0.03, 20, ?)`
      )
      .run(new Date().toISOString());
  }

  const shippingCount = database
    .prepare('SELECT COUNT(*) as c FROM shipping_rates')
    .get() as { c: number };
  if (shippingCount.c === 0) {
    const insert = database.prepare(`
      INSERT INTO shipping_rates (country, express_name, rate_1kg_usd, rate_2kg_usd, rate_3kg_usd, is_base_country)
      VALUES (@country, @express_name, @rate_1kg_usd, @rate_2kg_usd, @rate_3kg_usd, @is_base_country)
    `);
    for (const row of SHIPPING_SEED) {
      insert.run(row);
    }
  }
}

function runMigrations(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      key TEXT PRIMARY KEY,
      applied_at TEXT
    )
  `);
  const done = database
    .prepare("SELECT 1 FROM schema_migrations WHERE key = 'shipping_v2'")
    .get();
  if (!done) {
    recalculateAllProducts(database);
    database
      .prepare(
        "INSERT INTO schema_migrations (key, applied_at) VALUES ('shipping_v2', ?)"
      )
      .run(new Date().toISOString());
  }
}

interface SeedProduct {
  name: string;
  category: string;
  fulfillment_type: string;
  qty: number;
  buy_price_cny?: number | null;
  buy_price_aud?: number | null;
  is_aud_direct?: number;
  estimated_weight_kg: number;
  sale_price_aud: number;
}

const SEED_PRODUCTS: SeedProduct[] = [
  { name: 'NorthFace Puffer Jacket', category: 'Hoodies', fulfillment_type: 'Physical', qty: 9, buy_price_cny: null, estimated_weight_kg: 0.9, sale_price_aud: 150 },
  { name: 'Polo Puffer Vest', category: 'Hoodies', fulfillment_type: 'Physical', qty: 6, buy_price_cny: 109, estimated_weight_kg: 0.9, sale_price_aud: 120 },
  { name: 'Polo Shirt', category: 'Shirts', fulfillment_type: 'Physical', qty: 9, buy_price_cny: 49, estimated_weight_kg: 0.4, sale_price_aud: 60 },
  { name: 'City Polos', category: 'Shirts', fulfillment_type: 'Physical', qty: 21, buy_price_cny: 95, estimated_weight_kg: 0.4, sale_price_aud: 80 },
  { name: 'CH Long Sleeve', category: 'Shirts', fulfillment_type: 'Physical', qty: 13, buy_price_cny: 178, estimated_weight_kg: 0.4, sale_price_aud: 120 },
  { name: 'CH Bracelet', category: 'Accessories', fulfillment_type: 'Dropship', qty: -1, buy_price_cny: 15.9, estimated_weight_kg: 0.2, sale_price_aud: 30 },
  { name: 'CH Glasses', category: 'Accessories', fulfillment_type: 'Dropship', qty: -1, buy_price_cny: 17, estimated_weight_kg: 0.2, sale_price_aud: 35 },
  { name: 'P600', category: 'Shoes', fulfillment_type: 'Dropship', qty: -1, buy_price_cny: 159, estimated_weight_kg: 1.0, sale_price_aud: 110 },
  { name: 'Corties Shorts', category: 'Shorts', fulfillment_type: 'Dropship', qty: -1, buy_price_cny: 55, estimated_weight_kg: 0.4, sale_price_aud: 60 },
  { name: 'Berry Zipup Hoodie', category: 'Hoodies', fulfillment_type: 'Dropship', qty: -1, buy_price_cny: null, estimated_weight_kg: 0.7, sale_price_aud: 90 },
  { name: 'Airmax 95', category: 'Shoes', fulfillment_type: 'Dropship', qty: -1, buy_price_cny: 116, estimated_weight_kg: 1.0, sale_price_aud: 100 },
  { name: 'LV Skates', category: 'Shoes', fulfillment_type: 'Dropship', qty: -1, buy_price_cny: 120, estimated_weight_kg: 1.0, sale_price_aud: 105 },
  { name: "TN's", category: 'Shoes', fulfillment_type: 'Dropship', qty: -1, buy_price_cny: 98, estimated_weight_kg: 1.0, sale_price_aud: 80 },
  { name: 'Syna Pants', category: 'Pants', fulfillment_type: 'Dropship', qty: -1, buy_price_cny: 85, estimated_weight_kg: 0.6, sale_price_aud: 60 },
  { name: 'Syna Hoodie', category: 'Hoodies', fulfillment_type: 'Dropship', qty: -1, buy_price_cny: 85, estimated_weight_kg: 0.7, sale_price_aud: 80 },
  { name: 'Zara Flared Jeans', category: 'Jeans', fulfillment_type: 'Dropship', qty: -1, buy_price_cny: 168, estimated_weight_kg: 0.6, sale_price_aud: 90 },
  { name: 'Corties Pants', category: 'Pants', fulfillment_type: 'Dropship', qty: -1, buy_price_cny: 94, estimated_weight_kg: 0.6, sale_price_aud: 70 },
  { name: 'Gallery Flared Jeans', category: 'Jeans', fulfillment_type: 'Dropship', qty: -1, buy_price_aud: 11, is_aud_direct: 1, estimated_weight_kg: 0.6, sale_price_aud: 70 },
  { name: 'Corties Zipup', category: 'Hoodies', fulfillment_type: 'Dropship', qty: -1, buy_price_cny: 144, estimated_weight_kg: 0.7, sale_price_aud: 90 },
  { name: 'Berry Shorts', category: 'Shorts', fulfillment_type: 'Dropship', qty: -1, buy_price_cny: 99, estimated_weight_kg: 0.4, sale_price_aud: 80 },
  { name: 'NB 2002R', category: 'Shoes', fulfillment_type: 'Dropship', qty: -1, buy_price_cny: 165, estimated_weight_kg: 1.0, sale_price_aud: 120 },
  { name: 'RL Zipup', category: 'Hoodies', fulfillment_type: 'Dropship', qty: -1, buy_price_cny: 126, estimated_weight_kg: 0.7, sale_price_aud: 90 },
  { name: 'Polo Sweater', category: 'Hoodies', fulfillment_type: 'Dropship', qty: -1, buy_price_cny: null, estimated_weight_kg: 0.7, sale_price_aud: 80 },
  { name: "95's Corties", category: 'Shoes', fulfillment_type: 'Dropship', qty: -1, buy_price_cny: null, estimated_weight_kg: 1.0, sale_price_aud: 120 },
  { name: 'Gel Kayano 14', category: 'Shoes', fulfillment_type: 'Dropship', qty: -1, buy_price_cny: 167, estimated_weight_kg: 1.0, sale_price_aud: 110 },
  { name: 'CH Floral Zipup Hoodie', category: 'Hoodies', fulfillment_type: 'Dropship', qty: -1, buy_price_cny: 114, estimated_weight_kg: 0.7, sale_price_aud: 110 },
  { name: 'Essentials Open Pants', category: 'Pants', fulfillment_type: 'Dropship', qty: -1, buy_price_cny: null, estimated_weight_kg: 0.6, sale_price_aud: 90 },
  { name: 'Essentials Cuffed Pants', category: 'Pants', fulfillment_type: 'Dropship', qty: -1, buy_price_cny: null, estimated_weight_kg: 0.6, sale_price_aud: 90 },
  { name: 'Essentials Hoodie', category: 'Hoodies', fulfillment_type: 'Dropship', qty: -1, buy_price_cny: null, estimated_weight_kg: 0.7, sale_price_aud: 90 },
  { name: 'B22', category: 'Shoes', fulfillment_type: 'Dropship', qty: -1, buy_price_cny: null, estimated_weight_kg: 1.0, sale_price_aud: 120 },
  { name: 'B30', category: 'Shoes', fulfillment_type: 'Dropship', qty: -1, buy_price_cny: null, estimated_weight_kg: 1.0, sale_price_aud: 120 },
  { name: 'Essentials Shorts', category: 'Shorts', fulfillment_type: 'Dropship', qty: -1, buy_price_cny: 80, estimated_weight_kg: 0.4, sale_price_aud: 50 },
  { name: 'Gel NYC', category: 'Shoes', fulfillment_type: 'Dropship', qty: -1, buy_price_cny: 147, estimated_weight_kg: 1.0, sale_price_aud: 110 },
  { name: 'Essentials Shirts', category: 'Shirts', fulfillment_type: 'Dropship', qty: -1, buy_price_cny: 80, estimated_weight_kg: 0.4, sale_price_aud: 70 },
];

function seedIfEmpty(database: Database.Database) {
  const count = database
    .prepare('SELECT COUNT(*) as c FROM products')
    .get() as { c: number };
  if (count.c > 0) return;

  const exchangeRates = getExchangeRatesInput(database);
  const shippingRates = getShippingRatesInput(database);
  const insert = database.prepare(`
    INSERT INTO products (
      name, category, fulfillment_type, qty, buy_price_cny, buy_price_aud,
      shipping_buffer_aud, platform_fee_aud, total_cost_aud, estimated_weight_kg,
      sale_price_aud, revenue_aud, net_profit_aud, margin_percent, status,
      date_added, is_aud_direct, global_surcharge_aud
    ) VALUES (
      @name, @category, @fulfillment_type, @qty, @buy_price_cny, @buy_price_aud,
      @shipping_buffer_aud, @platform_fee_aud, @total_cost_aud, @estimated_weight_kg,
      @sale_price_aud, @revenue_aud, @net_profit_aud, @margin_percent, 'In Stock',
      @date_added, @is_aud_direct, @global_surcharge_aud
    )
  `);

  const now = new Date().toISOString();
  for (const p of SEED_PRODUCTS) {
    const isAudDirect = p.is_aud_direct ?? 0;
    const calc = calculateProduct(
      {
        buy_price_cny: p.buy_price_cny ?? null,
        buy_price_aud: p.buy_price_aud ?? null,
        is_aud_direct: isAudDirect,
        estimated_weight_kg: p.estimated_weight_kg,
        sale_price_aud: p.sale_price_aud,
        qty: p.qty,
      },
      exchangeRates,
      shippingRates
    );
    insert.run({
      name: p.name,
      category: p.category,
      fulfillment_type: p.fulfillment_type,
      qty: p.qty,
      buy_price_cny: p.buy_price_cny ?? null,
      buy_price_aud: calc.buy_price_aud,
      shipping_buffer_aud: calc.shipping_buffer_aud,
      platform_fee_aud: calc.platform_fee_aud,
      total_cost_aud: calc.total_cost_aud,
      estimated_weight_kg: p.estimated_weight_kg,
      sale_price_aud: p.sale_price_aud,
      revenue_aud: calc.revenue_aud,
      net_profit_aud: calc.net_profit_aud,
      margin_percent: calc.margin_percent,
      date_added: now,
      is_aud_direct: isAudDirect,
      global_surcharge_aud: calc.global_surcharge_aud,
    });
  }
}

export interface Product {
  id: number;
  name: string;
  category: string;
  fulfillment_type: string;
  qty: number;
  buy_price_cny: number | null;
  buy_price_aud: number | null;
  shipping_buffer_aud: number;
  global_surcharge_aud: number;
  platform_fee_aud: number | null;
  total_cost_aud: number | null;
  estimated_weight_kg: number;
  sale_price_aud: number;
  revenue_aud: number;
  net_profit_aud: number | null;
  margin_percent: number | null;
  status: string;
  date_added: string;
  is_aud_direct: number;
}

export interface ExchangeRates {
  id: number;
  usd_to_aud: number;
  cny_to_aud: number;
  alibaba_fee_percent: number;
  usd_per_kg_worst_case: number;
  last_updated: string | null;
}

export interface ShippingRate extends ShippingRateInput {}

function getExchangeRatesInput(database: Database.Database): ExchangeRatesInput {
  const row = database
    .prepare('SELECT * FROM exchange_rates WHERE id = 1')
    .get() as ExchangeRates;
  return {
    usd_to_aud: row.usd_to_aud,
    cny_to_aud: row.cny_to_aud,
    alibaba_fee_percent: row.alibaba_fee_percent,
  };
}

function getShippingRatesInput(database: Database.Database): ShippingRateInput[] {
  return database
    .prepare('SELECT * FROM shipping_rates ORDER BY id ASC')
    .all() as ShippingRateInput[];
}

function recalculateAllProducts(database: Database.Database) {
  const exchangeRates = getExchangeRatesInput(database);
  const shippingRates = getShippingRatesInput(database);
  const products = database.prepare('SELECT * FROM products').all() as Product[];
  const update = database.prepare(`
    UPDATE products SET
      buy_price_aud = ?, shipping_buffer_aud = ?, global_surcharge_aud = ?,
      platform_fee_aud = ?, total_cost_aud = ?, revenue_aud = ?,
      net_profit_aud = ?, margin_percent = ?
    WHERE id = ?
  `);

  for (const p of products) {
    const calc = calculateProduct(
      {
        buy_price_cny: p.buy_price_cny,
        buy_price_aud: p.is_aud_direct === 1 ? p.buy_price_aud : null,
        is_aud_direct: p.is_aud_direct,
        estimated_weight_kg: p.estimated_weight_kg,
        sale_price_aud: p.sale_price_aud,
        qty: p.qty,
      },
      exchangeRates,
      shippingRates
    );
    update.run(
      calc.buy_price_aud,
      calc.shipping_buffer_aud,
      calc.global_surcharge_aud,
      calc.platform_fee_aud,
      calc.total_cost_aud,
      calc.revenue_aud,
      calc.net_profit_aud,
      calc.margin_percent,
      p.id
    );
  }
}

export function getExchangeRates(): ExchangeRates {
  return getDb()
    .prepare('SELECT * FROM exchange_rates WHERE id = 1')
    .get() as ExchangeRates;
}

export function updateExchangeRates(
  data: Partial<ExchangeRatesInput & { usd_per_kg_worst_case?: number }>
): ExchangeRates {
  const database = getDb();
  const current = getExchangeRates();
  const now = new Date().toISOString();
  database
    .prepare(
      `UPDATE exchange_rates SET
        usd_to_aud = ?, cny_to_aud = ?, alibaba_fee_percent = ?,
        usd_per_kg_worst_case = COALESCE(?, usd_per_kg_worst_case), last_updated = ?
       WHERE id = 1`
    )
    .run(
      data.usd_to_aud ?? current.usd_to_aud,
      data.cny_to_aud ?? current.cny_to_aud,
      data.alibaba_fee_percent ?? current.alibaba_fee_percent,
      data.usd_per_kg_worst_case ?? null,
      now
    );
  recalculateAllProducts(database);
  return getExchangeRates();
}

export async function fetchLiveRates(): Promise<{ usd_to_aud: number; cny_to_aud: number }> {
  const apiKey = process.env.EXCHANGERATE_API_KEY;
  const url = apiKey
    ? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`
    : 'https://api.exchangerate-api.com/v4/latest/USD';

  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error('Failed to fetch exchange rates');
  const data = await res.json();

  let usdToAud: number;
  let cnyToAud: number;

  if (data.conversion_rates) {
    usdToAud = data.conversion_rates.AUD;
    const usdToCny = data.conversion_rates.CNY;
    cnyToAud = usdToAud / usdToCny;
  } else {
    usdToAud = data.rates.AUD;
    const usdToCny = data.rates.CNY;
    cnyToAud = usdToAud / usdToCny;
  }

  return { usd_to_aud: usdToAud, cny_to_aud: cnyToAud };
}

export function applyLiveRates(usdToAud: number, cnyToAud: number): ExchangeRates {
  return updateExchangeRates({ usd_to_aud: usdToAud, cny_to_aud: cnyToAud });
}

export function getAllShippingRates(): ShippingRate[] {
  return getDb()
    .prepare('SELECT * FROM shipping_rates ORDER BY id ASC')
    .all() as ShippingRate[];
}

export function updateShippingRate(
  id: number,
  data: Partial<Omit<ShippingRate, 'id'>>
): ShippingRate | null {
  const database = getDb();
  const existing = database
    .prepare('SELECT * FROM shipping_rates WHERE id = ?')
    .get(id) as ShippingRate | undefined;
  if (!existing) return null;

  database
    .prepare(
      `UPDATE shipping_rates SET
        country = ?, express_name = ?, rate_1kg_usd = ?,
        rate_2kg_usd = ?, rate_3kg_usd = ?, is_base_country = ?
       WHERE id = ?`
    )
    .run(
      data.country ?? existing.country,
      data.express_name ?? existing.express_name,
      data.rate_1kg_usd ?? existing.rate_1kg_usd,
      data.rate_2kg_usd ?? existing.rate_2kg_usd,
      data.rate_3kg_usd ?? existing.rate_3kg_usd,
      data.is_base_country ?? existing.is_base_country,
      id
    );

  recalculateAllProducts(database);
  return database
    .prepare('SELECT * FROM shipping_rates WHERE id = ?')
    .get(id) as ShippingRate;
}

export function setBaseShippingCountry(countryId: number): ShippingRate[] {
  const database = getDb();
  database.prepare('UPDATE shipping_rates SET is_base_country = 0').run();
  database
    .prepare('UPDATE shipping_rates SET is_base_country = 1 WHERE id = ?')
    .run(countryId);
  recalculateAllProducts(database);
  return getAllShippingRates();
}

export function getAllProducts(): { physical: Product[]; dropship: Product[] } {
  const products = getDb()
    .prepare('SELECT * FROM products ORDER BY id ASC')
    .all() as Product[];
  return {
    physical: products.filter((p) => p.fulfillment_type === 'Physical'),
    dropship: products.filter((p) => p.fulfillment_type === 'Dropship'),
  };
}

export interface CreateProductInput {
  name: string;
  category: string;
  fulfillment_type: string;
  qty: number;
  buy_price_cny?: number | null;
  buy_price_aud?: number | null;
  is_aud_direct?: number;
  estimated_weight_kg: number;
  sale_price_aud: number;
  status?: string;
}

export function createProduct(input: CreateProductInput): Product {
  const database = getDb();
  const exchangeRates = getExchangeRatesInput(database);
  const shippingRates = getShippingRatesInput(database);
  const isAudDirect = input.is_aud_direct ?? 0;
  const qty = input.fulfillment_type === 'Dropship' ? -1 : input.qty;

  const calc = calculateProduct(
    {
      buy_price_cny: isAudDirect ? null : (input.buy_price_cny ?? null),
      buy_price_aud: isAudDirect ? (input.buy_price_aud ?? null) : null,
      is_aud_direct: isAudDirect,
      estimated_weight_kg: input.estimated_weight_kg,
      sale_price_aud: input.sale_price_aud,
      qty,
    },
    exchangeRates,
    shippingRates
  );

  const result = database
    .prepare(
      `INSERT INTO products (
        name, category, fulfillment_type, qty, buy_price_cny, buy_price_aud,
        shipping_buffer_aud, global_surcharge_aud, platform_fee_aud, total_cost_aud,
        estimated_weight_kg, sale_price_aud, revenue_aud, net_profit_aud, margin_percent,
        status, date_added, is_aud_direct
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.name,
      input.category,
      input.fulfillment_type,
      qty,
      isAudDirect ? null : (input.buy_price_cny ?? null),
      calc.buy_price_aud,
      calc.shipping_buffer_aud,
      calc.global_surcharge_aud,
      calc.platform_fee_aud,
      calc.total_cost_aud,
      input.estimated_weight_kg,
      input.sale_price_aud,
      calc.revenue_aud,
      calc.net_profit_aud,
      calc.margin_percent,
      input.status ?? 'In Stock',
      new Date().toISOString(),
      isAudDirect
    );

  return getProductById(result.lastInsertRowid as number)!;
}

export function getProductById(id: number): Product | null {
  return (
    (getDb().prepare('SELECT * FROM products WHERE id = ?').get(id) as Product) ??
    null
  );
}

export function updateProduct(
  id: number,
  input: Partial<CreateProductInput> & { status?: string }
): Product | null {
  const database = getDb();
  const existing = getProductById(id);
  if (!existing) return null;

  const exchangeRates = getExchangeRatesInput(database);
  const shippingRates = getShippingRatesInput(database);
  const isAudDirect =
    input.is_aud_direct !== undefined ? input.is_aud_direct : existing.is_aud_direct;
  const fulfillmentType = input.fulfillment_type ?? existing.fulfillment_type;
  const qty =
    fulfillmentType === 'Dropship'
      ? -1
      : input.qty !== undefined
        ? input.qty
        : existing.qty;

  const buyPriceCny =
    isAudDirect === 1
      ? null
      : input.buy_price_cny !== undefined
        ? input.buy_price_cny
        : existing.buy_price_cny;

  const buyPriceAudDirect =
    isAudDirect === 1
      ? input.buy_price_aud !== undefined
        ? input.buy_price_aud
        : existing.buy_price_aud
      : null;

  const estimatedWeight =
    input.estimated_weight_kg ?? existing.estimated_weight_kg;
  const salePrice = input.sale_price_aud ?? existing.sale_price_aud;

  const calc = calculateProduct(
    {
      buy_price_cny: buyPriceCny,
      buy_price_aud: buyPriceAudDirect,
      is_aud_direct: isAudDirect,
      estimated_weight_kg: estimatedWeight,
      sale_price_aud: salePrice,
      qty,
    },
    exchangeRates,
    shippingRates
  );

  database
    .prepare(
      `UPDATE products SET
        name = ?, category = ?, fulfillment_type = ?, qty = ?,
        buy_price_cny = ?, buy_price_aud = ?, shipping_buffer_aud = ?,
        global_surcharge_aud = ?, platform_fee_aud = ?, total_cost_aud = ?,
        estimated_weight_kg = ?, sale_price_aud = ?, revenue_aud = ?,
        net_profit_aud = ?, margin_percent = ?, status = ?, is_aud_direct = ?
      WHERE id = ?`
    )
    .run(
      input.name ?? existing.name,
      input.category ?? existing.category,
      fulfillmentType,
      qty,
      buyPriceCny,
      calc.buy_price_aud,
      calc.shipping_buffer_aud,
      calc.global_surcharge_aud,
      calc.platform_fee_aud,
      calc.total_cost_aud,
      estimatedWeight,
      salePrice,
      calc.revenue_aud,
      calc.net_profit_aud,
      calc.margin_percent,
      input.status ?? existing.status,
      isAudDirect,
      id
    );

  return getProductById(id);
}

export function deleteProduct(id: number): boolean {
  const result = getDb().prepare('DELETE FROM products WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getDashboardStats() {
  const products = getDb()
    .prepare('SELECT * FROM products')
    .all() as Product[];

  const totalProducts = products.length;
  let totalCost = 0;
  let totalRevenue = 0;
  let totalProfit = 0;
  let marginSum = 0;
  let marginCount = 0;
  let tbdCount = 0;
  let onTarget = 0;
  let watch = 0;
  let belowTarget = 0;

  const fulfillmentMap: Record<
    string,
    { count: number; revenue: number; profit: number }
  > = {};
  const categoryMap: Record<
    string,
    { count: number; marginSum: number; marginCount: number; profit: number }
  > = {};

  for (const p of products) {
    const isTbd = p.buy_price_aud === null && p.buy_price_cny === null;
    if (isTbd) tbdCount++;

    if (p.net_profit_aud !== null) {
      if (p.net_profit_aud >= 50) onTarget++;
      else if (p.net_profit_aud >= 20) watch++;
      else belowTarget++;
    }

    if (p.total_cost_aud !== null) totalCost += p.total_cost_aud;
    totalRevenue += p.revenue_aud;
    if (p.net_profit_aud !== null) totalProfit += p.net_profit_aud;
    if (p.margin_percent !== null) {
      marginSum += p.margin_percent;
      marginCount++;
    }

    const ft = p.fulfillment_type;
    if (!fulfillmentMap[ft]) {
      fulfillmentMap[ft] = { count: 0, revenue: 0, profit: 0 };
    }
    fulfillmentMap[ft].count++;
    fulfillmentMap[ft].revenue += p.revenue_aud;
    if (p.net_profit_aud !== null) {
      fulfillmentMap[ft].profit += p.net_profit_aud;
    }

    const cat = p.category;
    if (!categoryMap[cat]) {
      categoryMap[cat] = { count: 0, marginSum: 0, marginCount: 0, profit: 0 };
    }
    categoryMap[cat].count++;
    if (p.margin_percent !== null) {
      categoryMap[cat].marginSum += p.margin_percent;
      categoryMap[cat].marginCount++;
    }
    if (p.net_profit_aud !== null) {
      categoryMap[cat].profit += p.net_profit_aud;
    }
  }

  const profitValues = products
    .map((p) => p.net_profit_aud)
    .filter((v): v is number => v !== null);
  const avgProfit =
    profitValues.length > 0
      ? profitValues.reduce((a, b) => a + b, 0) / profitValues.length
      : 0;

  return {
    kpis: {
      totalProducts,
      totalCostAud: totalCost,
      totalRevenueAud: totalRevenue,
      totalNetProfitAud: totalProfit,
      avgMarginPercent: marginCount > 0 ? marginSum / marginCount : 0,
      tbdCount,
      avgProfit,
    },
    profitHealth: { onTarget, watch, belowTarget },
    fulfillment: Object.entries(fulfillmentMap).map(([type, data]) => ({
      type,
      ...data,
    })),
    categories: Object.entries(categoryMap).map(([category, data]) => ({
      category,
      count: data.count,
      avgMargin:
        data.marginCount > 0 ? data.marginSum / data.marginCount : null,
      profit: data.profit,
    })),
  };
}
