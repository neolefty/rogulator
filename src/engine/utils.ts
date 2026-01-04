// Shared utility functions for Rogulator engine

import { Position, Tile, Room } from './types';

/**
 * Generate a unique string key for a position (for Map/Set lookups)
 */
export function posKey(pos: Position): string {
  return `${pos.x},${pos.y}`;
}

/**
 * Calculate Euclidean distance between two positions
 */
export function distance(a: Position, b: Position): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate Manhattan distance between two positions
 */
export function manhattanDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Check if a position is walkable on the given tile grid
 */
export function isWalkable(tiles: Tile[][], pos: Position): boolean {
  const tile = tiles[pos.y]?.[pos.x];
  if (!tile) return false;
  return tile.type !== 'wall';
}

/**
 * Check if two positions are the same
 */
export function positionsEqual(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

/**
 * Check if two positions are cardinally adjacent (no diagonals)
 */
export function isCardinallyAdjacent(a: Position, b: Position): boolean {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
}

/**
 * Check if a position is within a room's bounds
 */
export function isPositionInRoom(pos: Position, room: Room): boolean {
  return (
    pos.x >= room.bounds.x &&
    pos.x < room.bounds.x + room.bounds.width &&
    pos.y >= room.bounds.y &&
    pos.y < room.bounds.y + room.bounds.height
  );
}

/**
 * Find which room a position is in, or null if not in any room
 */
export function findRoomAtPosition(pos: Position, rooms: Room[]): Room | null {
  return rooms.find(room => isPositionInRoom(pos, room)) ?? null;
}
