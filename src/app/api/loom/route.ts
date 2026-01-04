import { NextRequest, NextResponse } from 'next/server';
import { generate, GenerationResult } from '@/loom/generate';
import { ModelTier, hasAnyProvider } from '@/loom/models';

export async function POST(request: NextRequest): Promise<NextResponse<GenerationResult>> {
  try {
    const body = await request.json();
    const { prompt, tier = 'quick' } = body as { prompt: string; tier?: ModelTier };

    if (!prompt) {
      return NextResponse.json(
        { text: '', success: false, error: 'Prompt is required', aiEnabled: hasAnyProvider },
        { status: 400 }
      );
    }

    const result = await generate(prompt, tier);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Loom API error:', error);
    return NextResponse.json(
      {
        text: '',
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        aiEnabled: hasAnyProvider,
      },
      { status: 500 }
    );
  }
}
