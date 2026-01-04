// The Loom - AI model configuration for Rogulator
// Supports Anthropic, OpenAI, and Google with automatic fallback
// Uses dynamic model discovery with fallback to hardcoded defaults

import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { LanguageModel } from 'ai';
import { getCachedModels, getModelForTier, type ModelCache } from './model-discovery';

// Check which providers are available
export const providers = {
  anthropic: !!process.env.ANTHROPIC_API_KEY,
  openai: !!process.env.OPENAI_API_KEY,
  google: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
};

export const hasAnyProvider = Object.values(providers).some(Boolean);

// Fallback model definitions (used when cache is empty or missing)
const fallbackModels = {
  anthropic: {
    quick: 'claude-3-5-haiku-latest',
    standard: 'claude-sonnet-4-20250514',
    premium: 'claude-sonnet-4-20250514',
  },
  openai: {
    quick: 'gpt-4o-mini',
    standard: 'gpt-4o',
    premium: 'gpt-4o',
  },
  google: {
    quick: 'gemini-2.0-flash',
    standard: 'gemini-1.5-pro',
    premium: 'gemini-1.5-pro',
  },
} as const;

// Model factory functions by provider
const modelFactories = {
  anthropic: (modelId: string) => anthropic(modelId),
  openai: (modelId: string) => openai(modelId),
  google: (modelId: string) => google(modelId),
};

// Get the model ID to use for a given provider and tier
function getModelId(
  provider: Provider,
  tier: ModelTier,
  cache: ModelCache | null
): string {
  // Try to use discovered model from cache
  if (cache) {
    const discovered = getModelForTier(cache, provider, tier);
    if (discovered) {
      return discovered.id;
    }
  }

  // Fall back to hardcoded defaults
  return fallbackModels[provider][tier];
}

export type ModelTier = 'quick' | 'standard' | 'premium';
export type Provider = 'anthropic' | 'openai' | 'google';

// Get the preferred provider order (configured ones first)
function getProviderOrder(): Provider[] {
  const order: Provider[] = [];
  if (providers.anthropic) order.push('anthropic');
  if (providers.openai) order.push('openai');
  if (providers.google) order.push('google');
  return order;
}

// Get a model for the given tier, using available providers
// Uses discovered models from cache, falls back to hardcoded defaults
export function getModel(tier: ModelTier): LanguageModel | null {
  const providerOrder = getProviderOrder();

  if (providerOrder.length === 0) {
    return null;
  }

  // Use the first available provider
  const provider = providerOrder[0];
  const cache = getCachedModels();
  const modelId = getModelId(provider, tier, cache);

  return modelFactories[provider](modelId);
}

// Get a specific provider's model (for testing or preference)
export function getModelFromProvider(provider: Provider, tier: ModelTier): LanguageModel | null {
  if (!providers[provider]) {
    return null;
  }

  const cache = getCachedModels();
  const modelId = getModelId(provider, tier, cache);

  return modelFactories[provider](modelId);
}

// For debugging/status
export function getProviderStatus(): Record<Provider, boolean> {
  return { ...providers };
}

// Re-export sync function for convenience
export { syncAllModels, isCacheStale } from './model-discovery';
