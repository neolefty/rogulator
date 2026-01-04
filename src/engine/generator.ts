// Floor and dungeon generator for Rogulator

import {
  Floor, Room, Tile, TileType, Position, Monster, Item, Macguffin,
  RoomType, RunConfig, MonsterTemplate, ItemTemplate, MacguffinTemplate
} from './types';
import { MONSTERS, ITEMS, MACGUFFINS, pickRandom, generateId } from './seeds';
import {
  FLOOR_WIDTH,
  FLOOR_HEIGHT,
  MONSTER_SPAWN_CHANCE,
  ITEMS_PER_FLOOR_MIN,
  ITEMS_PER_FLOOR_MAX,
  ROOM_PLACEMENT_ATTEMPTS,
  ROOM_PADDING,
  ROOM_SIZES,
  PLAYER_STARTING_HP,
} from './balance';

type Bounds = { x: number; y: number; width: number; height: number };

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createTileGrid(width: number, height: number, type: TileType): Tile[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({
      type,
      explored: false,
      visible: false,
    }))
  );
}

function carveRoom(tiles: Tile[][], bounds: Bounds): void {
  for (let y = bounds.y; y < bounds.y + bounds.height; y++) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
      if (y >= 0 && y < tiles.length && x >= 0 && x < tiles[0].length) {
        tiles[y][x].type = 'floor';
      }
    }
  }
}

function carveCorridor(tiles: Tile[][], from: Position, to: Position): void {
  let x = from.x;
  let y = from.y;

  // Horizontal first, then vertical
  while (x !== to.x) {
    if (y >= 0 && y < tiles.length && x >= 0 && x < tiles[0].length) {
      tiles[y][x].type = 'floor';
    }
    x += x < to.x ? 1 : -1;
  }
  while (y !== to.y) {
    if (y >= 0 && y < tiles.length && x >= 0 && x < tiles[0].length) {
      tiles[y][x].type = 'floor';
    }
    y += y < to.y ? 1 : -1;
  }
  if (y >= 0 && y < tiles.length && x >= 0 && x < tiles[0].length) {
    tiles[y][x].type = 'floor';
  }
}

function getRoomCenter(bounds: Bounds): Position {
  return {
    x: Math.floor(bounds.x + bounds.width / 2),
    y: Math.floor(bounds.y + bounds.height / 2),
  };
}

function boundsOverlap(a: Bounds, b: Bounds, padding: number = ROOM_PADDING): boolean {
  return !(
    a.x + a.width + padding < b.x ||
    b.x + b.width + padding < a.x ||
    a.y + a.height + padding < b.y ||
    b.y + b.height + padding < a.y
  );
}

function tryPlaceRoom(
  tiles: Tile[][],
  existingRooms: Bounds[],
  type: RoomType,
  floorWidth: number,
  floorHeight: number
): Bounds | null {
  const size = ROOM_SIZES[type];
  const width = randomInt(size.minW, size.maxW);
  const height = randomInt(size.minH, size.maxH);

  // Try random positions
  for (let attempt = 0; attempt < ROOM_PLACEMENT_ATTEMPTS; attempt++) {
    const x = randomInt(1, floorWidth - width - 1);
    const y = randomInt(1, floorHeight - height - 1);
    const bounds: Bounds = { x, y, width, height };

    const overlaps = existingRooms.some(existing => boundsOverlap(existing, bounds, ROOM_PADDING));
    if (!overlaps) {
      return bounds;
    }
  }
  return null;
}

function getRandomFloorTile(bounds: Bounds): Position {
  return {
    x: randomInt(bounds.x + 1, bounds.x + bounds.width - 2),
    y: randomInt(bounds.y + 1, bounds.y + bounds.height - 2),
  };
}

function spawnMonster(template: MonsterTemplate, position: Position): Monster {
  return {
    ...template,
    instanceId: generateId(),
    position,
    currentHp: template.hp,
  };
}

function spawnItem(template: ItemTemplate, position: Position): Item {
  return {
    ...template,
    instanceId: generateId(),
    position,
  };
}

function spawnMacguffin(template: MacguffinTemplate, position: Position): Macguffin {
  return {
    ...template,
    instanceId: generateId(),
    position,
    collected: false,
  };
}

export function generateFloor(
  floorNumber: number,
  config: RunConfig
): { floor: Floor; playerStart: Position } {
  const numRooms = config.roomsPerFloor;

  // Start with all walls
  const tiles = createTileGrid(FLOOR_WIDTH, FLOOR_HEIGHT, 'wall');
  const roomBounds: Bounds[] = [];
  const rooms: Room[] = [];

  // Generate rooms
  const roomTypes: RoomType[] = ['entry', 'exit'];
  for (let i = 2; i < numRooms; i++) {
    roomTypes.push(Math.random() > 0.3 ? 'chamber' : 'dead_end');
  }

  for (const roomType of roomTypes) {
    const bounds = tryPlaceRoom(tiles, roomBounds, roomType, FLOOR_WIDTH, FLOOR_HEIGHT);
    if (bounds) {
      carveRoom(tiles, bounds);
      roomBounds.push(bounds);
      rooms.push({
        id: generateId(),
        type: roomType,
        bounds,
        tiles: [], // We use the floor-level tiles
        monsters: [],
        items: [],
        macguffin: null,
      });
    }
  }

  // Connect rooms with corridors
  for (let i = 1; i < roomBounds.length; i++) {
    const from = getRoomCenter(roomBounds[i - 1]);
    const to = getRoomCenter(roomBounds[i]);
    carveCorridor(tiles, from, to);
  }

  // Find entry and exit rooms
  const entryRoom = rooms.find(r => r.type === 'entry') || rooms[0];
  const exitRoom = rooms.find(r => r.type === 'exit') || rooms[rooms.length - 1];

  // Place stairs
  const exitCenter = getRoomCenter(exitRoom.bounds);
  if (tiles[exitCenter.y] && tiles[exitCenter.y][exitCenter.x]) {
    tiles[exitCenter.y][exitCenter.x].type = 'stairs_down';
  }

  // Player start position
  const playerStart = getRoomCenter(entryRoom.bounds);

  // Spawn monsters (not in entry room)
  const monsters: Monster[] = [];
  const nonEntryRooms = rooms.filter(r => r.type !== 'entry');
  for (const room of nonEntryRooms) {
    if (Math.random() < MONSTER_SPAWN_CHANCE) {
      const template = pickRandom(MONSTERS);
      const pos = getRandomFloorTile(room.bounds);
      // Don't spawn on stairs
      if (tiles[pos.y][pos.x].type === 'floor') {
        monsters.push(spawnMonster(template, pos));
      }
    }
  }

  // Spawn items
  const items: Item[] = [];
  const itemCount = randomInt(ITEMS_PER_FLOOR_MIN, ITEMS_PER_FLOOR_MAX);
  for (let i = 0; i < itemCount && nonEntryRooms.length > 0; i++) {
    const room = pickRandom(nonEntryRooms);
    const template = pickRandom(ITEMS);
    const pos = getRandomFloorTile(room.bounds);
    if (tiles[pos.y][pos.x].type === 'floor') {
      items.push(spawnItem(template, pos));
    }
  }

  // Place macguffin in exit room (or far room) on first floor
  let macguffin: Macguffin | null = null;
  if (floorNumber === 1) {
    const template = pickRandom(MACGUFFINS);
    const pos = getRandomFloorTile(exitRoom.bounds);
    // Make sure not on stairs
    if (tiles[pos.y][pos.x].type === 'floor') {
      macguffin = spawnMacguffin(template, pos);
    } else {
      // Try again with a slight offset
      const altPos = { x: pos.x + 1, y: pos.y };
      if (tiles[altPos.y]?.[altPos.x]?.type === 'floor') {
        macguffin = spawnMacguffin(template, altPos);
      }
    }
  }

  return {
    floor: {
      number: floorNumber,
      width: FLOOR_WIDTH,
      height: FLOOR_HEIGHT,
      tiles,
      rooms,
      monsters,
      items,
      macguffin,
    },
    playerStart,
  };
}

export function createInitialPlayer(position: Position): import('./types').Player {
  return {
    position,
    hp: PLAYER_STARTING_HP,
    maxHp: PLAYER_STARTING_HP,
    weapon: null,
    armor: null,
    trinket: null,
    gold: 0,
    keys: 0,
    hasMacguffin: false,
  };
}
