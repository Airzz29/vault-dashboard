import { NextResponse } from 'next/server';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data } satisfies ApiResponse<T>, {
    status,
  });
}

export function apiError(message: string, status = 500) {
  return NextResponse.json(
    { success: false, error: message } satisfies ApiResponse,
    { status }
  );
}
