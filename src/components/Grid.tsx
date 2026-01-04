'use client';

import { Floor, Position, Monster, Item, Macguffin, Player } from '@/engine/types';
import { posKey } from '@/engine/utils';

type GridProps = {
  floor: Floor;
  player: Player;
  onTileClick: (pos: Position) => void;
};

const TILE_SIZE = 24; // Will be responsive

function getTileColor(type: string, visible: boolean, explored: boolean): string {
  if (!explored) return '#000000';

  const opacity = visible ? 1 : 0.4;

  const colors: Record<string, string> = {
    wall: `rgba(60, 60, 80, ${opacity})`,
    floor: `rgba(40, 40, 50, ${opacity})`,
    door: `rgba(139, 90, 43, ${opacity})`,
    stairs_down: `rgba(100, 100, 200, ${opacity})`,
    stairs_up: `rgba(200, 200, 100, ${opacity})`,
  };

  return colors[type] || `rgba(255, 0, 255, ${opacity})`;
}

function EntitySymbol({
  symbol,
  color,
  visible,
}: {
  symbol: string;
  color: string;
  visible: boolean;
}) {
  if (!visible) return null;

  return (
    <span
      className="absolute inset-0 flex items-center justify-center text-sm font-bold pointer-events-none"
      style={{ color }}
    >
      {symbol}
    </span>
  );
}

export function Grid({ floor, player, onTileClick }: GridProps) {
  const { tiles, monsters, items, macguffin } = floor;

  // Create lookup maps for entities
  const monsterMap = new Map<string, Monster>();
  for (const m of monsters) {
    if (m.currentHp > 0) {
      monsterMap.set(posKey(m.position), m);
    }
  }

  const itemMap = new Map<string, Item>();
  for (const i of items) {
    itemMap.set(posKey(i.position), i);
  }

  // Calculate viewport centered on player
  const viewportWidth = 21; // Odd number to center player
  const viewportHeight = 15;

  const startX = Math.max(0, Math.min(player.position.x - Math.floor(viewportWidth / 2), floor.width - viewportWidth));
  const startY = Math.max(0, Math.min(player.position.y - Math.floor(viewportHeight / 2), floor.height - viewportHeight));
  const endX = Math.min(floor.width, startX + viewportWidth);
  const endY = Math.min(floor.height, startY + viewportHeight);

  return (
    <div
      className="grid gap-0 bg-black p-1 rounded select-none"
      style={{
        gridTemplateColumns: `repeat(${endX - startX}, ${TILE_SIZE}px)`,
        gridTemplateRows: `repeat(${endY - startY}, ${TILE_SIZE}px)`,
      }}
    >
      {Array.from({ length: endY - startY }, (_, vy) => {
        const y = startY + vy;
        return Array.from({ length: endX - startX }, (_, vx) => {
          const x = startX + vx;
          const tile = tiles[y]?.[x];
          if (!tile) return null;

          const pos: Position = { x, y };
          const key = posKey(pos);
          const isPlayer = player.position.x === x && player.position.y === y;
          const monster = monsterMap.get(key);
          const item = itemMap.get(key);
          const hasMacguffin =
            macguffin &&
            !macguffin.collected &&
            macguffin.position.x === x &&
            macguffin.position.y === y;

          return (
            <div
              key={`${x},${y}`}
              className="relative cursor-pointer hover:brightness-125 transition-all"
              style={{
                width: TILE_SIZE,
                height: TILE_SIZE,
                backgroundColor: getTileColor(tile.type, tile.visible, tile.explored),
              }}
              onClick={() => onTileClick({ x, y })}
            >
              {/* Stairs indicator */}
              {tile.explored && tile.type === 'stairs_down' && (
                <span className="absolute inset-0 flex items-center justify-center text-xs text-blue-300">
                  {'>'}
                </span>
              )}

              {/* Item */}
              {item && tile.visible && (
                <EntitySymbol symbol={item.symbol} color={item.color} visible={true} />
              )}

              {/* Macguffin */}
              {hasMacguffin && tile.visible && (
                <EntitySymbol
                  symbol={macguffin.symbol}
                  color={macguffin.color}
                  visible={true}
                />
              )}

              {/* Monster */}
              {monster && tile.visible && (
                <EntitySymbol
                  symbol={monster.symbol}
                  color={monster.color}
                  visible={true}
                />
              )}

              {/* Player (always on top) */}
              {isPlayer && (
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-yellow-400">
                  @
                </span>
              )}
            </div>
          );
        });
      })}
    </div>
  );
}
