import { apiError, apiSuccess } from '@/lib/api-response';
import { getAllShippingRates } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rates = getAllShippingRates();
    return apiSuccess(rates);
  } catch (error) {
    console.error(error);
    return apiError('Failed to fetch shipping rates');
  }
}
