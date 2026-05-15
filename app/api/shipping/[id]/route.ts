import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api-response';
import { updateShippingRate } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) return apiError('Invalid ID', 400);
    const body = await request.json();
    const rate = updateShippingRate(id, body);
    if (!rate) return apiError('Shipping rate not found', 404);
    return apiSuccess(rate);
  } catch (error) {
    console.error(error);
    return apiError('Failed to update shipping rate');
  }
}
