import { NextResponse } from 'next/server';
import { getProviderStatus, hasAnyProvider } from '@/loom/models';

export async function GET() {
  return NextResponse.json({
    enabled: hasAnyProvider,
    providers: getProviderStatus(),
  });
}
