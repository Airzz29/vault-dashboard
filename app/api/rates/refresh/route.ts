import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { fetchLiveRates, applyLiveRates } from '@/lib/db';

export async function POST() {
  try {
    const live = await fetchLiveRates();
    const rates = applyLiveRates(live.usd_to_aud, live.cny_to_aud);
    return NextResponse.json(rates);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to refresh rates' },
      { status: 500 }
    );
  }
}
