// A* pathfinding for Rogulator

import { Position, Tile } from './types';

type Node = {
  pos: Position;
  g: number; // Cost from start
  h: number; // Heuristic (estimated cost to goal)
  f: number; // g + h
  parent: Node | null;
};

function heuristic(a: Position, b: Position): number {
  // Manhattan distance
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function posKey(pos: Position): string {
  return `${pos.x},${pos.y}`;
}

function isWalkable(tiles: Tile[][], pos: Position): boolean {
  const tile = tiles[pos.y]?.[pos.x];
  if (!tile) return false;
  return tile.type !== 'wall';
}

const DIRECTIONS: Position[] = [
  { x: 0, y: -1 }, // up
  { x: 0, y: 1 },  // down
  { x: -1, y: 0 }, // left
  { x: 1, y: 0 },  // right
];

/**
 * Find a path from start to goal using A*.
 * Returns array of positions from start to goal (inclusive), or null if no path.
 * maxLength limits search depth for performance.
 */
export function findPath(
  tiles: Tile[][],
  start: Position,
  goal: Position,
  maxLength: number = 20,
  blockedPositions: Position[] = []
): Position[] | null {
  // Quick exit if goal is unreachable
  if (!isWalkable(tiles, goal)) return null;

  const blocked = new Set(blockedPositions.map(posKey));
  const openSet: Node[] = [];
  const closedSet = new Set<string>();

  const startNode: Node = {
    pos: start,
    g: 0,
    h: heuristic(start, goal),
    f: heuristic(start, goal),
    parent: null,
  };
  openSet.push(startNode);

  while (openSet.length > 0) {
    // Find node with lowest f score
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;
    const currentKey = posKey(current.pos);

    // Found the goal
    if (current.pos.x === goal.x && current.pos.y === goal.y) {
      // Reconstruct path
      const path: Position[] = [];
      let node: Node | null = current;
      while (node) {
        path.unshift(node.pos);
        node = node.parent;
      }
      return path;
    }

    closedSet.add(currentKey);

    // Check if we've gone too far
    if (current.g >= maxLength) continue;

    // Explore neighbors
    for (const dir of DIRECTIONS) {
      const neighborPos: Position = {
        x: current.pos.x + dir.x,
        y: current.pos.y + dir.y,
      };
      const neighborKey = posKey(neighborPos);

      // Skip if already evaluated, blocked, or not walkable
      if (closedSet.has(neighborKey)) continue;
      if (blocked.has(neighborKey)) continue;
      if (!isWalkable(tiles, neighborPos)) continue;

      const g = current.g + 1;
      const h = heuristic(neighborPos, goal);
      const f = g + h;

      // Check if this path to neighbor is better
      const existing = openSet.find(n => posKey(n.pos) === neighborKey);
      if (existing) {
        if (g < existing.g) {
          existing.g = g;
          existing.f = f;
          existing.parent = current;
        }
      } else {
        openSet.push({
          pos: neighborPos,
          g,
          h,
          f,
          parent: current,
        });
      }
    }
  }

  // No path found
  return null;
}

/**
 * Get the next step toward a goal, or null if no path exists.
 * This is the main function monsters should use.
 */
export function getNextStep(
  tiles: Tile[][],
  from: Position,
  to: Position,
  blockedPositions: Position[] = []
): Position | null {
  const path = findPath(tiles, from, to, 20, blockedPositions);
  if (!path || path.length < 2) return null;
  return path[1]; // path[0] is the current position
}
