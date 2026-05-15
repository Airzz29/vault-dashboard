import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api-response';
import { updateProduct, deleteProduct } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) return apiError('Invalid ID', 400);
    const body = await request.json();
    const product = updateProduct(id, body);
    if (!product) return apiError('Product not found', 404);
    return apiSuccess(product);
  } catch (error) {
    console.error(error);
    return apiError('Failed to update product');
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) return apiError('Invalid ID', 400);
    const deleted = deleteProduct(id);
    if (!deleted) return apiError('Product not found', 404);
    return apiSuccess({ deleted: true });
  } catch (error) {
    console.error(error);
    return apiError('Failed to delete product');
  }
}
