# Rogulator Architecture

## Core Idea

A roguelike where AI is an *enrichment layer*, not a dependency. The mechanical engine runs independently; The Loom (AI) injects narrative when available.

## Why This is Interesting

Traditional procedural generation: "Goblin #47, HP 8"
AI-enhanced: "A goblin in tattered motley—once a court jester, banished for one joke too many. It eyes your sword warily."

The magic is **coherent interconnection**. AI can:
- Notice the player's sword matches a blacksmith mark from floor 1
- Remember that the player spared a creature earlier
- Generate dialog that couldn't have been pre-written
- Build narrative threads that grow, climax, or get abandoned

## Architecture

```
┌─────────────────────────────────────────┐
│              React UI                    │
│  Grid.tsx, Status.tsx, GameView.tsx     │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────┴───────────────────────┐
│           Zustand Store                  │
│  gameStore.ts (with localStorage)        │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────┴───────────────────────┐
│           Game Engine                    │
│  state.ts    - game loop, combat        │
│  generator.ts - floor/room generation   │
│  pathfinding.ts - A* for monsters       │
│  visibility.ts - line of sight          │
│  types.ts    - Player, Monster, etc     │
│  seeds.ts    - baseline content pool    │
└─────────────────┬───────────────────────┘
                  │ hooks (onRoomEntered, onCombat, etc)
┌─────────────────┴───────────────────────┐
│            The Loom (AI)                 │
│  models.ts  - provider selection        │
│  prompts.ts - context + templates       │
│  generate.ts - async generation         │
│                                          │
│  Tiers:                                  │
│    quick (Haiku) - room flavor, combat  │
│    standard (Sonnet) - notable encounters│
│    premium (Opus) - thread climax       │
└─────────────────────────────────────────┘
```

## Key Design Decisions

**Mutable state + Zustand**: Game engines naturally mutate. Fighting React's immutability was painful. Zustand lets us mutate and just spread to trigger renders.

**Macguffin objectives**: Every run has a thing to retrieve. "Grocery run" = get the milk carton. Gives clear win condition and thematic hook.

**AI seeds on entities**: Monsters/items can have optional `aiSeed` strings that The Loom uses for coherent generation. Pool grows over time as AI generates more.

**Variable monster speed**: Skeletons are slow (0.5), rats are fast (0.9). Lets player outrun threats, adds tactical depth without complexity.

**Finite runs with dial**: Quick (1 floor) to Epic (20 floors). Casual-friendly but can go deep.

## The Loom - What's Exciting

**Context assembly**: Sample recent events, bias toward high-engagement moments, occasional deep history dives. Player's choices compound.

**Narrative threads**: Data structures that track ongoing storylines. Initiate on events (enemy escapes, near-death), develop over floors, climax or get abandoned.

**Engagement tracking**: Measure dwell time, dialog depth, exploration thoroughness. Weight context toward what player actually cared about.

**Cross-run memory**: Unresolved threads, recurring NPCs, player reputation. The dungeon remembers.

## Files That Matter

- `src/engine/state.ts` - The game loop, where hooks would fire
- `src/engine/types.ts` - All data structures
- `src/loom/prompts.ts` - Context builders and prompt templates
- `src/store/gameStore.ts` - State management with persistence
