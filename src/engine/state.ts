// Game state management for Rogulator

import { GameState, RunConfig, Position, GameMessage, Monster, Item } from './types';
import { generateFloor, createInitialPlayer } from './generator';
import { updateVisibility } from './visibility';
import { generateId } from './seeds';

export function createNewGame(config: RunConfig): GameState {
  const { floor, playerStart } = generateFloor(1, config);
  const player = createInitialPlayer(playerStart);

  const state: GameState = {
    runId: generateId(),
    config,
    player,
    floor,
    floorNumber: 1,
    turn: 0,
    status: 'playing',
    messages: [
      {
        text: `You enter the dungeon. Find the ${floor.macguffin?.name || 'exit'} and escape!`,
        type: 'system',
        turn: 0,
      },
    ],
  };

  // Initial visibility
  updateVisibility(state.floor, state.player.position);

  return state;
}

function addMessage(state: GameState, text: string, type: GameMessage['type']): void {
  state.messages.push({ text, type, turn: state.turn });
  // Keep only last 50 messages
  if (state.messages.length > 50) {
    state.messages = state.messages.slice(-50);
  }
}

function isWalkable(state: GameState, pos: Position): boolean {
  const tile = state.floor.tiles[pos.y]?.[pos.x];
  if (!tile) return false;
  return tile.type !== 'wall';
}

function getMonsterAt(state: GameState, pos: Position): Monster | undefined {
  return state.floor.monsters.find(
    m => m.position.x === pos.x && m.position.y === pos.y && m.currentHp > 0
  );
}

function getItemAt(state: GameState, pos: Position): Item | undefined {
  return state.floor.items.find(
    i => i.position.x === pos.x && i.position.y === pos.y
  );
}

function removeItem(state: GameState, item: Item): void {
  state.floor.items = state.floor.items.filter(i => i.instanceId !== item.instanceId);
}

function removeMonster(state: GameState, monster: Monster): void {
  state.floor.monsters = state.floor.monsters.filter(m => m.instanceId !== monster.instanceId);
}

function playerAttack(state: GameState, monster: Monster): void {
  const baseDamage = 2;
  const weaponDamage = state.player.weapon?.effect ?? 0;
  const totalDamage = baseDamage + weaponDamage;

  monster.currentHp -= totalDamage;
  addMessage(state, `You hit the ${monster.name} for ${totalDamage} damage!`, 'combat');

  if (monster.currentHp <= 0) {
    addMessage(state, `The ${monster.name} is defeated!`, 'combat');
    removeMonster(state, monster);
  }
}

function monsterAttack(state: GameState, monster: Monster): void {
  const baseDamage = monster.damage;
  const armorReduction = state.player.armor?.effect ?? 0;
  const totalDamage = Math.max(1, baseDamage - armorReduction);

  state.player.hp -= totalDamage;
  addMessage(state, `The ${monster.name} hits you for ${totalDamage} damage!`, 'combat');

  if (state.player.hp <= 0) {
    state.player.hp = 0;
    state.status = 'lost';
    addMessage(state, 'You have been defeated...', 'system');
  }
}

function pickupItem(state: GameState, item: Item): void {
  switch (item.type) {
    case 'weapon':
      if (state.player.weapon) {
        addMessage(state, `You swap your ${state.player.weapon.name} for ${item.name}.`, 'pickup');
      } else {
        addMessage(state, `You pick up ${item.name}.`, 'pickup');
      }
      state.player.weapon = item;
      break;
    case 'armor':
      if (state.player.armor) {
        addMessage(state, `You swap your ${state.player.armor.name} for ${item.name}.`, 'pickup');
      } else {
        addMessage(state, `You pick up ${item.name}.`, 'pickup');
      }
      state.player.armor = item;
      break;
    case 'consumable':
      const healAmount = Math.min(item.effect, state.player.maxHp - state.player.hp);
      state.player.hp += healAmount;
      addMessage(state, `You drink ${item.name} and heal ${healAmount} HP.`, 'pickup');
      break;
    case 'gold':
      state.player.gold += item.effect;
      addMessage(state, `You pick up ${item.effect} gold.`, 'pickup');
      break;
    case 'key':
      state.player.keys += 1;
      addMessage(state, `You pick up ${item.name}.`, 'pickup');
      break;
  }
  removeItem(state, item);
}

function checkMacguffin(state: GameState): void {
  const macguffin = state.floor.macguffin;
  if (
    macguffin &&
    !macguffin.collected &&
    macguffin.position.x === state.player.position.x &&
    macguffin.position.y === state.player.position.y
  ) {
    macguffin.collected = true;
    state.player.hasMacguffin = true;
    addMessage(state, `You pick up the ${macguffin.name}!`, 'pickup');
  }
}

function checkWinCondition(state: GameState): void {
  const tile = state.floor.tiles[state.player.position.y]?.[state.player.position.x];

  // Win if on stairs and have macguffin
  if (tile?.type === 'stairs_down' && state.player.hasMacguffin) {
    state.status = 'won';
    addMessage(state, 'You escaped with the treasure! Victory!', 'system');
  }
}

function moveMonsters(state: GameState): void {
  for (const monster of state.floor.monsters) {
    if (monster.currentHp <= 0) continue;

    // Check if monster can see player (simple distance check)
    const dx = state.player.position.x - monster.position.x;
    const dy = state.player.position.y - monster.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 8) continue; // Too far to notice

    // If adjacent, attack
    if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && (dx !== 0 || dy !== 0)) {
      monsterAttack(state, monster);
      continue;
    }

    // Move towards player (simple approach)
    if (monster.behavior === 'aggressive' || monster.behavior === 'passive') {
      const moveX = dx !== 0 ? (dx > 0 ? 1 : -1) : 0;
      const moveY = dy !== 0 ? (dy > 0 ? 1 : -1) : 0;

      // Try horizontal first, then vertical
      const newPos: Position = { x: monster.position.x + moveX, y: monster.position.y };
      if (isWalkable(state, newPos) && !getMonsterAt(state, newPos)) {
        monster.position = newPos;
      } else {
        const altPos: Position = { x: monster.position.x, y: monster.position.y + moveY };
        if (isWalkable(state, altPos) && !getMonsterAt(state, altPos)) {
          monster.position = altPos;
        }
      }
    }
  }
}

export type MoveDirection = 'up' | 'down' | 'left' | 'right';

export function processPlayerMove(state: GameState, direction: MoveDirection): GameState {
  if (state.status !== 'playing') return state;

  const delta: Record<MoveDirection, Position> = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  const d = delta[direction];
  const newPos: Position = {
    x: state.player.position.x + d.x,
    y: state.player.position.y + d.y,
  };

  // Check for monster (bump to attack)
  const monster = getMonsterAt(state, newPos);
  if (monster) {
    playerAttack(state, monster);
    state.turn++;
    moveMonsters(state);
    updateVisibility(state.floor, state.player.position);
    return state;
  }

  // Check walkable
  if (!isWalkable(state, newPos)) {
    return state; // Can't move, no turn consumed
  }

  // Move player
  state.player.position = newPos;
  state.turn++;

  // Check for item pickup
  const item = getItemAt(state, newPos);
  if (item) {
    pickupItem(state, item);
  }

  // Check for macguffin
  checkMacguffin(state);

  // Check win condition
  checkWinCondition(state);

  // Monster turns
  if (state.status === 'playing') {
    moveMonsters(state);
  }

  // Update visibility
  updateVisibility(state.floor, state.player.position);

  return state;
}

export function processPlayerClick(state: GameState, targetPos: Position): GameState {
  if (state.status !== 'playing') return state;

  const dx = targetPos.x - state.player.position.x;
  const dy = targetPos.y - state.player.position.y;

  // If adjacent, move/attack in that direction
  if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && (dx !== 0 || dy !== 0)) {
    // Determine primary direction
    if (Math.abs(dx) >= Math.abs(dy)) {
      return processPlayerMove(state, dx > 0 ? 'right' : 'left');
    } else {
      return processPlayerMove(state, dy > 0 ? 'down' : 'up');
    }
  }

  // For now, only handle adjacent moves
  // TODO: Implement pathfinding for distant clicks
  return state;
}
