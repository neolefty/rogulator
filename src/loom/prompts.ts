// The Loom - Prompt templates for AI generation

import { Floor, Player, Monster, GameMessage } from '@/engine/types';

export const SYSTEM_PROMPT = `You are The Loom, the narrative engine for Rogulator, a roguelike dungeon crawler.
Your role is to weave engaging, atmospheric descriptions that bring the dungeon to life.

Style guidelines:
- Be concise but evocative (1-3 sentences typically)
- Match the tone to the situation (tense in combat, mysterious in exploration)
- Occasional dry humor is welcome
- Reference the player's state when relevant (low health = desperation, new weapon = confidence)
- Build connections between encounters when possible
- Never break the fourth wall unless specifically appropriate

The dungeon aesthetic: A strange place between mundane and mythic.
A "grocery run" might be a corner store that's somehow become a labyrinth.
Goblins might be former employees. Rats are just rats, but unsettlingly large.`;

export function buildRoomContext(floor: Floor, player: Player, recentMessages: GameMessage[]): string {
  const room = floor.rooms.find(r =>
    player.position.x >= r.bounds.x &&
    player.position.x < r.bounds.x + r.bounds.width &&
    player.position.y >= r.bounds.y &&
    player.position.y < r.bounds.y + r.bounds.height
  );

  const nearbyMonsters = floor.monsters.filter(m => {
    const dx = Math.abs(m.position.x - player.position.x);
    const dy = Math.abs(m.position.y - player.position.y);
    return dx <= 5 && dy <= 5 && m.currentHp > 0;
  });

  const context = {
    floorNumber: floor.number,
    roomType: room?.type || 'corridor',
    playerHp: `${player.hp}/${player.maxHp}`,
    playerWeapon: player.weapon?.name || 'bare fists',
    hasMacguffin: player.hasMacguffin,
    macguffinName: floor.macguffin?.name,
    nearbyMonsters: nearbyMonsters.map(m => ({ name: m.name, hp: m.currentHp })),
    recentEvents: recentMessages.slice(-3).map(m => m.text),
  };

  return JSON.stringify(context, null, 2);
}

export function roomDescriptionPrompt(context: string): string {
  return `Given this game state:
${context}

Generate a brief atmospheric description of the room the player just entered.
1-2 sentences. Focus on mood and any notable features.`;
}

export function combatNarrationPrompt(
  attacker: string,
  target: string,
  damage: number,
  targetHp: number,
  wasKill: boolean
): string {
  return `Narrate this combat action in one vivid sentence:
- Attacker: ${attacker}
- Target: ${target}
- Damage dealt: ${damage}
- Target HP remaining: ${wasKill ? 'DEFEATED' : targetHp}

Be dramatic but brief. Vary your descriptions.`;
}

export function monsterEncounterPrompt(monster: { name: string; aiSeed?: string }, context: string): string {
  return `A ${monster.name} is encountered.
${monster.aiSeed ? `Background: ${monster.aiSeed}` : ''}

Game context:
${context}

Generate a brief (1 sentence) description of how this creature appears or reacts to the player.`;
}

export function macguffinPickupPrompt(macguffinName: string, description: string): string {
  return `The player just picked up the ${macguffinName}.
Description: ${description}

Generate a brief (1-2 sentences) moment of acquisition. Make it feel significant but not overwrought.`;
}

export function victoryPrompt(macguffinName: string, turnCount: number, monstersDefeated: number): string {
  return `The player escaped the dungeon with the ${macguffinName}!
- Turns taken: ${turnCount}
- Enemies defeated: ${monstersDefeated}

Generate a brief (2-3 sentences) victory message. Acknowledge their accomplishment with appropriate gravitas or humor depending on the macguffin.`;
}

export function defeatPrompt(killedBy: string, floorNumber: number): string {
  return `The player was defeated by a ${killedBy} on floor ${floorNumber}.

Generate a brief (1-2 sentences) death message. Dark but not cruel. Maybe a touch of dark humor.`;
}
