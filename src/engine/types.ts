// Core game types for Rogulator

export type Position = { x: number; y: number };

export type TileType = 'floor' | 'wall' | 'door' | 'stairs_down' | 'stairs_up';

export type Tile = {
  type: TileType;
  explored: boolean;
  visible: boolean;
};

export type EntityType = 'player' | 'monster' | 'item' | 'macguffin';

export type MonsterBehavior = 'aggressive' | 'passive' | 'fleeing' | 'stationary';
export type MonsterDisposition = 'hostile' | 'neutral' | 'friendly';

export type MonsterTemplate = {
  id: string;
  name: string;
  hp: number;
  damage: number;
  speed: number; // 0-1, chance to act each turn (1 = always, 0.5 = half the time)
  behavior: MonsterBehavior;
  disposition: MonsterDisposition;
  symbol: string;
  color: string;
  aiSeed?: string;
};

export type Monster = MonsterTemplate & {
  instanceId: string;
  position: Position;
  currentHp: number;
};

export type ItemType = 'weapon' | 'armor' | 'consumable' | 'key' | 'gold';

export type ItemTemplate = {
  id: string;
  name: string;
  type: ItemType;
  effect: number; // damage for weapons, defense for armor, heal for consumable
  symbol: string;
  color: string;
  aiSeed?: string;
};

export type Item = ItemTemplate & {
  instanceId: string;
  position: Position;
};

export type MacguffinTemplate = {
  id: string;
  name: string;
  description: string;
  symbol: string;
  color: string;
  quirk?: 'fragile' | 'glowing' | 'heavy' | 'attracts_enemies';
  aiSeed?: string;
};

export type Macguffin = MacguffinTemplate & {
  instanceId: string;
  position: Position;
  collected: boolean;
};

export type Player = {
  position: Position;
  hp: number;
  maxHp: number;
  weapon: ItemTemplate | null;
  armor: ItemTemplate | null;
  trinket: ItemTemplate | null;
  gold: number;
  keys: number;
  hasMacguffin: boolean;
};

export type RoomType = 'entry' | 'corridor' | 'chamber' | 'dead_end' | 'exit';

export type Room = {
  id: string;
  type: RoomType;
  bounds: { x: number; y: number; width: number; height: number };
  tiles: Tile[][];
  monsters: Monster[];
  items: Item[];
  macguffin: Macguffin | null;
  aiSeed?: string;
  description?: string;
};

export type Floor = {
  number: number;
  width: number;
  height: number;
  tiles: Tile[][];
  rooms: Room[];
  monsters: Monster[];
  items: Item[];
  macguffin: Macguffin | null;
};

export type GameStatus = 'playing' | 'won' | 'lost';

export type GameMessage = {
  text: string;
  type: 'info' | 'combat' | 'pickup' | 'system';
  turn: number;
};

export type RunConfig = {
  size: 'quick' | 'short' | 'medium' | 'long' | 'epic';
  floors: number;
  roomsPerFloor: number;
  threadsMax: number;
};

export const RUN_CONFIGS: Record<RunConfig['size'], RunConfig> = {
  quick: { size: 'quick', floors: 1, roomsPerFloor: 5, threadsMax: 0 },
  short: { size: 'short', floors: 3, roomsPerFloor: 5, threadsMax: 1 },
  medium: { size: 'medium', floors: 6, roomsPerFloor: 6, threadsMax: 2 },
  long: { size: 'long', floors: 12, roomsPerFloor: 5, threadsMax: 3 },
  epic: { size: 'epic', floors: 20, roomsPerFloor: 5, threadsMax: 5 },
};

export type GameState = {
  runId: string;
  config: RunConfig;
  player: Player;
  floor: Floor;
  floorNumber: number;
  turn: number;
  status: GameStatus;
  messages: GameMessage[];
};
