// The Loom - AI model configuration for Rogulator

import { anthropic } from '@ai-sdk/anthropic';

// Model tiers for different tasks
export const models = {
  // Fast, cheap - room descriptions, combat narration, quick dialog
  quick: anthropic('claude-3-5-haiku-latest'),

  // Balanced - thread development, notable encounters, connections
  standard: anthropic('claude-sonnet-4-20250514'),

  // Premium - thread climax, cross-run narrative, major reveals
  premium: anthropic('claude-sonnet-4-20250514'), // Use Opus when needed: anthropic('claude-opus-4-20250514')
};

export type ModelTier = keyof typeof models;
