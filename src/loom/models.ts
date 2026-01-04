// The Loom - AI model configuration for Rogulator
// Supports Anthropic, OpenAI, and Google with automatic fallback

import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { LanguageModel } from 'ai';

// Check which providers are available
export const providers = {
  anthropic: !!process.env.ANTHROPIC_API_KEY,
  openai: !!process.env.OPENAI_API_KEY,
  google: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
};

export const hasAnyProvider = Object.values(providers).some(Boolean);

// Model definitions by provider and tier
const modelOptions = {
  anthropic: {
    quick: () => anthropic('claude-3-5-haiku-latest'),
    standard: () => anthropic('claude-sonnet-4-20250514'),
    premium: () => anthropic('claude-sonnet-4-20250514'), // or claude-opus-4-20250514
  },
  openai: {
    quick: () => openai('gpt-4o-mini'),
    standard: () => openai('gpt-4o'),
    premium: () => openai('gpt-4o'),
  },
  google: {
    quick: () => google('gemini-2.0-flash'),
    standard: () => google('gemini-1.5-pro'),
    premium: () => google('gemini-1.5-pro'),
  },
} as const;

export type ModelTier = 'quick' | 'standard' | 'premium';
export type Provider = keyof typeof modelOptions;

// Get the preferred provider order (configured ones first)
function getProviderOrder(): Provider[] {
  const order: Provider[] = [];
  if (providers.anthropic) order.push('anthropic');
  if (providers.openai) order.push('openai');
  if (providers.google) order.push('google');
  return order;
}

// Get a model for the given tier, using available providers
export function getModel(tier: ModelTier): LanguageModel | null {
  const providerOrder = getProviderOrder();

  if (providerOrder.length === 0) {
    return null;
  }

  // Use the first available provider
  const provider = providerOrder[0];
  return modelOptions[provider][tier]();
}

// Get a specific provider's model (for testing or preference)
export function getModelFromProvider(provider: Provider, tier: ModelTier): LanguageModel | null {
  if (!providers[provider]) {
    return null;
  }
  return modelOptions[provider][tier]();
}

// For debugging/status
export function getProviderStatus(): Record<Provider, boolean> {
  return { ...providers };
}
