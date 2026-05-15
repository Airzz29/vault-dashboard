import { apiError, apiSuccess } from '@/lib/api-response';
import { fetchLiveRates, applyLiveRates } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const live = await fetchLiveRates();
    const rates = applyLiveRates(live.usd_to_aud, live.cny_to_aud);
    return apiSuccess(rates);
  } catch (error) {
    console.error(error);
    return apiError('Failed to refresh rates');
  }
}
