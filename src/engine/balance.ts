// Game balance constants for Rogulator
// Centralized here for easy tuning

// === Player ===
export const PLAYER_STARTING_HP = 30;
export const PLAYER_BASE_DAMAGE = 2;

// === Healing ===
export const HEAL_AMOUNT = 1;
export const HEAL_INTERVAL_MOVING = 10;  // Heal 1 HP every N turns while moving
export const HEAL_INTERVAL_RESTING = 3;  // Heal 1 HP every N turns while resting

// === Combat ===
export const MIN_DAMAGE = 1;  // Minimum damage after armor reduction

// === Visibility ===
export const VIEW_RADIUS = 8;
export const MONSTER_DETECTION_RANGE = 8;

// === Generation ===
export const FLOOR_WIDTH = 50;
export const FLOOR_HEIGHT = 40;
export const MONSTER_SPAWN_CHANCE = 0.5;
export const ITEMS_PER_FLOOR_MIN = 1;
export const ITEMS_PER_FLOOR_MAX = 2;
export const ROOM_PLACEMENT_ATTEMPTS = 30;
export const ROOM_PADDING = 2;

// === Room Sizes ===
export const ROOM_SIZES = {
  entry: { minW: 5, maxW: 7, minH: 5, maxH: 7 },
  exit: { minW: 5, maxW: 7, minH: 5, maxH: 7 },
  corridor: { minW: 3, maxW: 3, minH: 5, maxH: 9 },
  chamber: { minW: 5, maxW: 9, minH: 5, maxH: 9 },
  dead_end: { minW: 4, maxW: 5, minH: 4, maxH: 5 },
} as const;

// === Pathfinding ===
export const PATHFINDING_MAX_DEPTH = 20;

// === Messages ===
export const MAX_MESSAGES = 50;
