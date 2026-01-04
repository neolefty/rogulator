// Seed data for Rogulator - baseline content that works without AI

import { MonsterTemplate, ItemTemplate, MacguffinTemplate } from './types';

export const MONSTERS: MonsterTemplate[] = [
  {
    id: 'rat',
    name: 'Rat',
    hp: 4,
    damage: 1,
    speed: 0.9, // Fast and skittery
    behavior: 'aggressive',
    disposition: 'hostile',
    symbol: 'r',
    color: '#8B4513',
  },
  {
    id: 'goblin',
    name: 'Goblin',
    hp: 8,
    damage: 2,
    speed: 0.75, // Moderately quick
    behavior: 'aggressive',
    disposition: 'hostile',
    symbol: 'g',
    color: '#228B22',
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    hp: 12,
    damage: 3,
    speed: 0.5, // Slow and shambling
    behavior: 'aggressive',
    disposition: 'hostile',
    symbol: 's',
    color: '#F5F5DC',
  },
];

export const ITEMS: ItemTemplate[] = [
  {
    id: 'rusty_sword',
    name: 'Rusty Sword',
    type: 'weapon',
    effect: 3,
    symbol: '/',
    color: '#B87333',
  },
  {
    id: 'iron_sword',
    name: 'Iron Sword',
    type: 'weapon',
    effect: 5,
    symbol: '/',
    color: '#C0C0C0',
  },
  {
    id: 'wooden_shield',
    name: 'Wooden Shield',
    type: 'armor',
    effect: 1,
    symbol: ')',
    color: '#DEB887',
  },
  {
    id: 'leather_armor',
    name: 'Leather Armor',
    type: 'armor',
    effect: 2,
    symbol: '[',
    color: '#8B4513',
  },
  {
    id: 'health_potion',
    name: 'Health Potion',
    type: 'consumable',
    effect: 10,
    symbol: '!',
    color: '#FF6347',
  },
  {
    id: 'gold_coin',
    name: 'Gold Coin',
    type: 'gold',
    effect: 5,
    symbol: '$',
    color: '#FFD700',
  },
  {
    id: 'rusty_key',
    name: 'Rusty Key',
    type: 'key',
    effect: 1,
    symbol: '-',
    color: '#B87333',
  },
];

export const MACGUFFINS: MacguffinTemplate[] = [
  {
    id: 'milk_carton',
    name: 'Milk Carton',
    description: 'A perfectly ordinary carton of milk. Expires tomorrow.',
    symbol: '%',
    color: '#FFFFFF',
    quirk: 'fragile',
  },
  {
    id: 'lost_keys',
    name: 'Lost Keys',
    description: 'A jangling set of keys. Someone must be looking for these.',
    symbol: '-',
    color: '#FFD700',
  },
  {
    id: 'ancient_scroll',
    name: 'Ancient Scroll',
    description: 'Dusty parchment covered in arcane symbols.',
    symbol: '?',
    color: '#F5DEB3',
    quirk: 'glowing',
  },
  {
    id: 'crystal_orb',
    name: 'Crystal Orb',
    description: 'A perfectly spherical crystal that hums faintly.',
    symbol: '*',
    color: '#E6E6FA',
    quirk: 'attracts_enemies',
  },
  {
    id: 'golden_idol',
    name: 'Golden Idol',
    description: 'Surprisingly heavy for its size.',
    symbol: '&',
    color: '#FFD700',
    quirk: 'heavy',
  },
];

// Helper to pick a random element
export function pickRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper to generate unique instance IDs
let instanceCounter = 0;
export function generateId(): string {
  return `${Date.now()}-${++instanceCounter}`;
}
