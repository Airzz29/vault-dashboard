import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api-response';
import { getExchangeRates, updateExchangeRates } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rates = getExchangeRates();
    return apiSuccess(rates);
  } catch (error) {
    console.error(error);
    return apiError('Failed to fetch rates');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const rates = updateExchangeRates(body);
    return apiSuccess(rates);
  } catch (error) {
    console.error(error);
    return apiError('Failed to update rates');
  }
}
