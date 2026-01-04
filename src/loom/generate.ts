// The Loom - AI generation functions

import { generateText } from 'ai';
import { models, ModelTier } from './models';
import { SYSTEM_PROMPT } from './prompts';

export type GenerationResult = {
  text: string;
  success: boolean;
  error?: string;
};

export async function generate(
  prompt: string,
  tier: ModelTier = 'quick'
): Promise<GenerationResult> {
  try {
    const { text } = await generateText({
      model: models[tier],
      system: SYSTEM_PROMPT,
      prompt,
      maxTokens: 150,
      temperature: 0.8,
    });

    return { text: text.trim(), success: true };
  } catch (error) {
    console.error('Loom generation error:', error);
    return {
      text: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Convenience wrappers for specific generation types
export async function generateRoomDescription(prompt: string): Promise<string | null> {
  const result = await generate(prompt, 'quick');
  return result.success ? result.text : null;
}

export async function generateCombatNarration(prompt: string): Promise<string | null> {
  const result = await generate(prompt, 'quick');
  return result.success ? result.text : null;
}

export async function generateNotableEncounter(prompt: string): Promise<string | null> {
  const result = await generate(prompt, 'standard');
  return result.success ? result.text : null;
}

export async function generateClimaxMoment(prompt: string): Promise<string | null> {
  const result = await generate(prompt, 'premium');
  return result.success ? result.text : null;
}
