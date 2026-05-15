import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api-response';
import { setBaseShippingCountry } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  try {
    const { countryId } = await request.json();
    if (!countryId) return apiError('countryId is required', 400);
    const rates = setBaseShippingCountry(Number(countryId));
    return apiSuccess(rates);
  } catch (error) {
    console.error(error);
    return apiError('Failed to set base country');
  }
}
