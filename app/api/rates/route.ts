import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getExchangeRates, updateExchangeRates } from '@/lib/db';

export async function GET() {
  try {
    const rates = getExchangeRates();
    return NextResponse.json(rates);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to fetch rates' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const rates = updateExchangeRates(body);
    return NextResponse.json(rates);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to update rates' },
      { status: 500 }
    );
  }
}
