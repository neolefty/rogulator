// The Loom - AI generation functions

import { generateText } from 'ai';
import { getModel, hasAnyProvider, ModelTier } from './models';
import { SYSTEM_PROMPT } from './prompts';

export type GenerationResult = {
  text: string;
  success: boolean;
  error?: string;
  aiEnabled: boolean;
};

export async function generate(
  prompt: string,
  tier: ModelTier = 'quick'
): Promise<GenerationResult> {
  // Check if any AI provider is configured
  if (!hasAnyProvider) {
    return {
      text: '',
      success: false,
      error: 'No AI provider configured',
      aiEnabled: false,
    };
  }

  const model = getModel(tier);
  if (!model) {
    return {
      text: '',
      success: false,
      error: 'No model available for tier: ' + tier,
      aiEnabled: false,
    };
  }

  try {
    const { text } = await generateText({
      model,
      system: SYSTEM_PROMPT,
      prompt,
      maxOutputTokens: 150,
      temperature: 0.8,
    });

    return { text: text.trim(), success: true, aiEnabled: true };
  } catch (error) {
    console.error('Loom generation error:', error);
    return {
      text: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      aiEnabled: true,
    };
  }
}

// Check if AI is available (for UI feedback)
export function isAIAvailable(): boolean {
  return hasAnyProvider;
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
