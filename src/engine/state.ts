// Game state management for Rogulator

import { GameState, RunConfig, Position, GameMessage, Monster, Item, Room } from './types';
import { generateFloor, createInitialPlayer } from './generator';
import { updateVisibility } from './visibility';
import { generateId } from './seeds';
import { getNextStep } from './pathfinding';
import { isWalkable, isCardinallyAdjacent, positionsEqual, distance, findRoomAtPosition } from './utils';
import {
  PLAYER_BASE_DAMAGE,
  HEAL_AMOUNT,
  HEAL_INTERVAL_MOVING,
  HEAL_INTERVAL_RESTING,
  MIN_DAMAGE,
  MONSTER_DETECTION_RANGE,
  MAX_MESSAGES,
} from './balance';

export function createNewGame(config: RunConfig): GameState {
  const { floor, playerStart } = generateFloor(1, config);
  const player = createInitialPlayer(playerStart);

  // Find initial room
  const initialRoom = findRoomAtPosition(playerStart, floor.rooms);

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
    currentRoomId: initialRoom?.id ?? null,
    previousRoomId: null,
  };

  // Initial visibility
  updateVisibility(state.floor, state.player.position);

  return state;
}

function addMessage(state: GameState, text: string, type: GameMessage['type']): void {
  state.messages.push({ text, type, turn: state.turn });
  if (state.messages.length > MAX_MESSAGES) {
    state.messages = state.messages.slice(-MAX_MESSAGES);
  }
}

function isWalkableInState(state: GameState, pos: Position): boolean {
  return isWalkable(state.floor.tiles, pos);
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
  const weaponDamage = state.player.weapon?.effect ?? 0;
  const totalDamage = PLAYER_BASE_DAMAGE + weaponDamage;

  monster.currentHp -= totalDamage;
  addMessage(state, `You hit the ${monster.name} for ${totalDamage} damage!`, 'combat');

  if (monster.currentHp <= 0) {
    addMessage(state, `The ${monster.name} is defeated!`, 'combat');
    removeMonster(state, monster);
  }
}

function monsterAttack(state: GameState, monster: Monster): void {
  const armorReduction = state.player.armor?.effect ?? 0;
  const totalDamage = Math.max(MIN_DAMAGE, monster.damage - armorReduction);

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

function applyHealing(state: GameState, isResting: boolean): void {
  if (state.player.hp >= state.player.maxHp) return;

  const interval = isResting ? HEAL_INTERVAL_RESTING : HEAL_INTERVAL_MOVING;
  if (state.turn > 0 && state.turn % interval === 0) {
    state.player.hp = Math.min(state.player.hp + HEAL_AMOUNT, state.player.maxHp);
    if (isResting) {
      addMessage(state, 'You feel a bit better.', 'info');
    }
  }
}

function updateCurrentRoom(state: GameState): boolean {
  const newRoom = findRoomAtPosition(state.player.position, state.floor.rooms);
  const newRoomId = newRoom?.id ?? null;

  if (newRoomId !== state.currentRoomId) {
    state.previousRoomId = state.currentRoomId;
    state.currentRoomId = newRoomId;
    return true; // Room changed
  }
  return false; // Same room
}

function moveMonsters(state: GameState): void {
  // Get positions of all living monsters (to avoid collisions)
  const monsterPositions = state.floor.monsters
    .filter(m => m.currentHp > 0)
    .map(m => m.position);

  for (const monster of state.floor.monsters) {
    if (monster.currentHp <= 0) continue;

    // Speed check - monster may skip this turn
    if (Math.random() > monster.speed) continue;

    // Check if monster can see player (simple distance check)
    const dist = distance(monster.position, state.player.position);

    if (dist > MONSTER_DETECTION_RANGE) continue; // Too far to notice

    // If cardinally adjacent, attack (no diagonal attacks)
    if (isCardinallyAdjacent(monster.position, state.player.position)) {
      monsterAttack(state, monster);
      continue;
    }

    // Use pathfinding to move towards player
    if (monster.behavior === 'aggressive' || monster.behavior === 'passive') {
      // Block positions of other monsters (except self)
      const blockedPositions = monsterPositions.filter(
        p => !(p.x === monster.position.x && p.y === monster.position.y)
      );
      // Don't block player - we want to pathfind TO them, but we'll stop when adjacent

      const nextStep = getNextStep(
        state.floor.tiles,
        monster.position,
        state.player.position,
        blockedPositions
      );

      // Only move if not stepping onto player (we attack instead when adjacent)
      if (nextStep &&
          !getMonsterAt(state, nextStep) &&
          !positionsEqual(nextStep, state.player.position)) {
        monster.position = nextStep;
      }
    }
  }
}

export type MoveDirection = 'up' | 'down' | 'left' | 'right';

function endTurn(state: GameState, isResting: boolean): void {
  state.turn++;
  applyHealing(state, isResting);

  if (state.status === 'playing') {
    moveMonsters(state);
  }

  updateVisibility(state.floor, state.player.position);
}

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
    endTurn(state, false);
    return state;
  }

  // Check walkable
  if (!isWalkableInState(state, newPos)) {
    return state; // Can't move, no turn consumed
  }

  // Move player
  state.player.position = newPos;

  // Track room changes
  updateCurrentRoom(state);

  // Check for item pickup
  const item = getItemAt(state, newPos);
  if (item) {
    pickupItem(state, item);
  }

  // Check for macguffin
  checkMacguffin(state);

  // Check win condition
  checkWinCondition(state);

  // End turn
  endTurn(state, false);

  return state;
}

export function processPlayerRest(state: GameState): GameState {
  if (state.status !== 'playing') return state;

  addMessage(state, 'You wait...', 'info');
  endTurn(state, true);

  return state;
}

export function getCurrentRoom(state: GameState): Room | null {
  if (!state.currentRoomId) return null;
  return state.floor.rooms.find(r => r.id === state.currentRoomId) ?? null;
}

export function didEnterNewRoom(state: GameState): boolean {
  return state.currentRoomId !== null && state.previousRoomId !== state.currentRoomId;
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

  // Clicking on self = rest
  if (dx === 0 && dy === 0) {
    return processPlayerRest(state);
  }

  // For now, only handle adjacent moves
  // TODO: Implement pathfinding for distant clicks
  return state;
}
