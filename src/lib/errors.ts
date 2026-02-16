import { NextResponse } from 'next/server';

export class AppError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = 'AppError';
    this.status = status;
  }
}

export function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error';
}

export function errorResponse(error: unknown, fallback = 'Internal server error') {
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: toErrorMessage(error) || fallback }, { status: 500 });
}
