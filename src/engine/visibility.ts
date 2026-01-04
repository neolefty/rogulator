// Line-of-sight and visibility for Rogulator

import { Floor, Position, Tile } from './types';
import { VIEW_RADIUS } from './balance';

// Simple raycasting for line of sight
function lineOfSight(
  tiles: Tile[][],
  from: Position,
  to: Position
): boolean {
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  const sx = from.x < to.x ? 1 : -1;
  const sy = from.y < to.y ? 1 : -1;

  let err = dx - dy;
  let x = from.x;
  let y = from.y;

  while (true) {
    // Check if current tile blocks sight
    if (x !== from.x || y !== from.y) {
      if (!tiles[y] || !tiles[y][x] || tiles[y][x].type === 'wall') {
        return false;
      }
    }

    if (x === to.x && y === to.y) {
      return true;
    }

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

export function updateVisibility(floor: Floor, playerPos: Position, viewRadius: number = VIEW_RADIUS): void {
  const { tiles } = floor;

  // Reset visibility (but keep explored)
  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[y].length; x++) {
      tiles[y][x].visible = false;
    }
  }

  // Calculate visible tiles from player position
  const minY = Math.max(0, playerPos.y - viewRadius);
  const maxY = Math.min(tiles.length - 1, playerPos.y + viewRadius);
  const minX = Math.max(0, playerPos.x - viewRadius);
  const maxX = Math.min(tiles[0].length - 1, playerPos.x + viewRadius);

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - playerPos.x;
      const dy = y - playerPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= viewRadius) {
        const target: Position = { x, y };
        if (lineOfSight(tiles, playerPos, target)) {
          tiles[y][x].visible = true;
          tiles[y][x].explored = true;
        }
      }
    }
  }

  // Player's tile is always visible
  if (tiles[playerPos.y] && tiles[playerPos.y][playerPos.x]) {
    tiles[playerPos.y][playerPos.x].visible = true;
    tiles[playerPos.y][playerPos.x].explored = true;
  }
}

export function isPositionVisible(floor: Floor, pos: Position): boolean {
  const tile = floor.tiles[pos.y]?.[pos.x];
  return tile?.visible ?? false;
}

export function isPositionExplored(floor: Floor, pos: Position): boolean {
  const tile = floor.tiles[pos.y]?.[pos.x];
  return tile?.explored ?? false;
}
