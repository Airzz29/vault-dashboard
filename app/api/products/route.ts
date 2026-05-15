import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api-response';
import { getAllProducts, createProduct } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = getAllProducts();
    return apiSuccess(products);
  } catch (error) {
    console.error(error);
    return apiError('Failed to fetch products');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const product = createProduct(body);
    return apiSuccess(product, 201);
  } catch (error) {
    console.error(error);
    return apiError('Failed to create product');
  }
}
