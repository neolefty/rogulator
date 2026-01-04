# Rogulator

AI-enhanced roguelike. The engine works without AI; The Loom adds narrative.

## Quick Context

- **Stack**: Next.js 14, TypeScript, Zustand, Vercel AI SDK
- **State**: Mutable game state in Zustand (not React's useState - that caused StrictMode pain)
- **Persistence**: localStorage via Zustand persist middleware

## Key Files

- `src/engine/state.ts` - Game loop, where AI hooks should fire
- `src/engine/balance.ts` - Tunable constants (damage, healing, speeds)
- `src/engine/utils.ts` - Shared helpers (posKey, isWalkable, distance)
- `src/loom/` - AI layer (scaffolded, not yet wired in)
- `src/store/gameStore.ts` - Zustand store

## What's Working

- Grid movement, A* pathfinding, line-of-sight visibility
- Combat (bump to attack, cardinal only)
- Monster speed variance, passive healing, rest action
- Macguffin objectives, win/lose conditions
- localStorage save/restore

## What's Next

1. Wire The Loom into gameplay (room descriptions on entry)
2. Multi-floor (stairs descend)
3. Narrative threads (see ROADMAP.md)

## Gotchas

- Room tracking added: `state.currentRoomId`, `state.previousRoomId` - use for AI room-entry hooks
- Monsters only attack cardinally (matching player movement)
- API keys in `.env.local` (see `.env.example`)

## Copilot Reviews

Copilot finds real bugs and inconsistencies - fix those. Ignore suggestions for JSDoc or comments that just restate what clear function names already say.

## Docs

- `ARCHITECTURE.md` - Design philosophy, why AI+mechanical hybrid
- `ROADMAP.md` - Done/next/future breakdown
