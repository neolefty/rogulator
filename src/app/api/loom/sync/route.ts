import { NextResponse } from 'next/server';
import { syncAllModels, getCachedModels, isCacheStale } from '@/loom/model-discovery';

export async function GET() {
  const cache = getCachedModels();
  const stale = isCacheStale();

  return NextResponse.json({
    lastSync: cache?.lastSync || null,
    isStale: stale,
    modelCounts: cache
      ? {
          anthropic: cache.providers.anthropic.length,
          openai: cache.providers.openai.length,
          google: cache.providers.google.length,
        }
      : null,
  });
}

export async function POST() {
  try {
    const cache = await syncAllModels();

    return NextResponse.json({
      success: true,
      lastSync: cache.lastSync,
      modelCounts: {
        anthropic: cache.providers.anthropic.length,
        openai: cache.providers.openai.length,
        google: cache.providers.google.length,
      },
    });
  } catch (error) {
    console.error('Model sync failed:', error);
    return NextResponse.json(
      { success: false, error: 'Sync failed' },
      { status: 500 }
    );
  }
}
