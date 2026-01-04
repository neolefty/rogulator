// Dynamic model discovery for AI providers
// Fetches available models from each provider and caches them locally

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface DiscoveredModel {
  id: string;
  displayName: string;
  tier: 'quick' | 'standard' | 'premium' | null;
  provider: 'anthropic' | 'openai' | 'google';
}

export interface ModelCache {
  lastSync: string;
  providers: {
    anthropic: DiscoveredModel[];
    openai: DiscoveredModel[];
    google: DiscoveredModel[];
  };
}

const CACHE_DIR = join(process.cwd(), '.cache');
const CACHE_FILE = join(CACHE_DIR, 'models.json');
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

// Tier mapping based on model naming patterns
function inferTier(modelId: string): 'quick' | 'standard' | 'premium' | null {
  const id = modelId.toLowerCase();

  // Quick tier: fast, cheap models
  if (id.includes('haiku') || id.includes('mini') || id.includes('flash')) {
    return 'quick';
  }

  // Premium tier: best quality models
  if (id.includes('opus') || id.includes('ultra') || id.includes('o1') || id.includes('o3')) {
    return 'premium';
  }

  // Standard tier: balanced models
  if (
    id.includes('sonnet') ||
    id.includes('gpt-4o') ||
    id.includes('gpt-4-turbo') ||
    id.includes('pro')
  ) {
    return 'standard';
  }

  return null;
}

// Filter to only include chat/completion models we care about
function isRelevantModel(modelId: string, provider: string): boolean {
  const id = modelId.toLowerCase();

  if (provider === 'anthropic') {
    return id.includes('claude');
  }

  if (provider === 'openai') {
    // Include GPT models, exclude embeddings, whisper, dall-e, etc.
    return (
      (id.includes('gpt') || id.includes('o1') || id.includes('o3')) &&
      !id.includes('instruct') &&
      !id.includes('realtime')
    );
  }

  if (provider === 'google') {
    return id.includes('gemini');
  }

  return false;
}

async function fetchAnthropicModels(): Promise<DiscoveredModel[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return [];

  try {
    const response = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    });

    if (!response.ok) {
      console.warn(`Anthropic API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const models: DiscoveredModel[] = [];

    for (const model of data.data || []) {
      if (isRelevantModel(model.id, 'anthropic')) {
        models.push({
          id: model.id,
          displayName: model.display_name || model.id,
          tier: inferTier(model.id),
          provider: 'anthropic',
        });
      }
    }

    return models;
  } catch (error) {
    console.warn('Failed to fetch Anthropic models:', error);
    return [];
  }
}

async function fetchOpenAIModels(): Promise<DiscoveredModel[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return [];

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      console.warn(`OpenAI API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const models: DiscoveredModel[] = [];

    for (const model of data.data || []) {
      if (isRelevantModel(model.id, 'openai')) {
        models.push({
          id: model.id,
          displayName: model.id,
          tier: inferTier(model.id),
          provider: 'openai',
        });
      }
    }

    return models;
  } catch (error) {
    console.warn('Failed to fetch OpenAI models:', error);
    return [];
  }
}

async function fetchGoogleModels(): Promise<DiscoveredModel[]> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return [];

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    if (!response.ok) {
      console.warn(`Google API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const models: DiscoveredModel[] = [];

    for (const model of data.models || []) {
      // Google returns "models/gemini-2.0-flash", we want just "gemini-2.0-flash"
      const modelId = model.name?.replace('models/', '') || '';
      if (isRelevantModel(modelId, 'google')) {
        models.push({
          id: modelId,
          displayName: model.displayName || modelId,
          tier: inferTier(modelId),
          provider: 'google',
        });
      }
    }

    return models;
  } catch (error) {
    console.warn('Failed to fetch Google models:', error);
    return [];
  }
}

export async function syncAllModels(): Promise<ModelCache> {
  console.log('Syncing models from providers...');

  const [anthropic, openai, google] = await Promise.all([
    fetchAnthropicModels(),
    fetchOpenAIModels(),
    fetchGoogleModels(),
  ]);

  const cache: ModelCache = {
    lastSync: new Date().toISOString(),
    providers: { anthropic, openai, google },
  };

  // Write to cache file
  try {
    if (!existsSync(CACHE_DIR)) {
      mkdirSync(CACHE_DIR, { recursive: true });
    }
    writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
    console.log(
      `Model cache updated: ${anthropic.length} Anthropic, ${openai.length} OpenAI, ${google.length} Google`
    );
  } catch (error) {
    console.warn('Failed to write model cache:', error);
  }

  return cache;
}

export function getCachedModels(): ModelCache | null {
  try {
    if (!existsSync(CACHE_FILE)) {
      return null;
    }

    const data = readFileSync(CACHE_FILE, 'utf-8');
    return JSON.parse(data) as ModelCache;
  } catch (error) {
    console.warn('Failed to read model cache:', error);
    return null;
  }
}

export function isCacheStale(): boolean {
  const cache = getCachedModels();
  if (!cache) return true;

  const lastSync = new Date(cache.lastSync).getTime();
  const now = Date.now();
  return now - lastSync > CACHE_MAX_AGE_MS;
}

// Get models, syncing if cache is stale
export async function getModels(): Promise<ModelCache> {
  if (isCacheStale()) {
    return await syncAllModels();
  }
  return getCachedModels()!;
}

// Get the best model for a tier from a specific provider
export function getModelForTier(
  cache: ModelCache,
  provider: 'anthropic' | 'openai' | 'google',
  tier: 'quick' | 'standard' | 'premium'
): DiscoveredModel | null {
  const models = cache.providers[provider];
  // Find first model matching the tier
  return models.find((m) => m.tier === tier) || null;
}
