'use client';

import { Player, GameMessage, GameStatus, Macguffin } from '@/engine/types';

type StatusProps = {
  player: Player;
  turn: number;
  status: GameStatus;
  messages: GameMessage[];
  macguffin: Macguffin | null;
};

function HealthBar({ current, max }: { current: number; max: number }) {
  const percentage = Math.max(0, (current / max) * 100);
  const color =
    percentage > 60 ? 'bg-green-500' : percentage > 30 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm w-12">HP</span>
      <div className="flex-1 h-4 bg-gray-700 rounded overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-200`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm w-16 text-right">
        {current}/{max}
      </span>
    </div>
  );
}

function EquipmentSlot({
  label,
  item,
}: {
  label: string;
  item: { name: string; effect: number } | null;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-400 w-16">{label}:</span>
      <span className={item ? 'text-white' : 'text-gray-600'}>
        {item ? `${item.name} (+${item.effect})` : 'None'}
      </span>
    </div>
  );
}

export function Status({ player, turn, status, messages, macguffin }: StatusProps) {
  const recentMessages = messages.slice(-5).reverse();

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-900 rounded text-white min-w-64">
      {/* Game status */}
      {status !== 'playing' && (
        <div
          className={`text-center py-2 rounded font-bold ${
            status === 'won' ? 'bg-green-700' : 'bg-red-700'
          }`}
        >
          {status === 'won' ? 'VICTORY!' : 'GAME OVER'}
        </div>
      )}

      {/* Health */}
      <HealthBar current={player.hp} max={player.maxHp} />

      {/* Equipment */}
      <div className="space-y-1">
        <EquipmentSlot label="Weapon" item={player.weapon} />
        <EquipmentSlot label="Armor" item={player.armor} />
      </div>

      {/* Resources */}
      <div className="flex gap-4 text-sm">
        <span className="text-yellow-400">Gold: {player.gold}</span>
        <span className="text-amber-600">Keys: {player.keys}</span>
      </div>

      {/* Macguffin status */}
      {macguffin && (
        <div className="text-sm">
          <span className="text-gray-400">Objective: </span>
          <span className={player.hasMacguffin ? 'text-green-400' : 'text-orange-400'}>
            {player.hasMacguffin
              ? `${macguffin.name} (Got it! Find the exit)`
              : `Find the ${macguffin.name}`}
          </span>
        </div>
      )}

      {/* Turn counter */}
      <div className="text-xs text-gray-500">Turn: {turn}</div>

      {/* Messages */}
      <div className="border-t border-gray-700 pt-2">
        <div className="text-xs text-gray-400 mb-1">Log:</div>
        <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
          {recentMessages.map((msg, i) => (
            <div
              key={`${msg.turn}-${i}`}
              className={`${
                msg.type === 'combat'
                  ? 'text-red-300'
                  : msg.type === 'pickup'
                  ? 'text-green-300'
                  : msg.type === 'system'
                  ? 'text-blue-300'
                  : 'text-gray-300'
              }`}
            >
              {msg.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
