# Rogulator Roadmap

## Done

### Core Engine
- [x] Grid generation with variable room sizes
- [x] Line-of-sight visibility (visible/explored/unknown)
- [x] A* pathfinding for monsters
- [x] Combat (bump to attack, cardinal directions only)
- [x] Monster speed variance (rats fast, skeletons slow)
- [x] Passive healing (1 HP/10 turns) + rest action (1 HP/3 turns)
- [x] Macguffin objectives + win/lose conditions
- [x] Item pickups (weapons, armor, consumables, gold, keys)

### Infrastructure
- [x] Zustand store with localStorage persistence
- [x] Multi-provider AI support (Anthropic, OpenAI, Google)
- [x] Mobile controls + responsive layout
- [x] Keyboard (WASD/arrows) + click movement

### The Loom (scaffolded)
- [x] Model tier system (quick/standard/premium)
- [x] Prompt templates for rooms, combat, encounters
- [x] API routes for generation

## Next Up

### Wire The Loom into gameplay
- [ ] Call `generateRoomDescription()` on room entry
- [ ] Display AI text in a collapsible panel or toast
- [ ] Combat narration (optional, togglable)
- [ ] Pre-generate next rooms in background

### Multi-floor
- [ ] Stairs actually descend
- [ ] Floor difficulty scaling
- [ ] Macguffin placement on deeper floors for longer runs

## Future

### Narrative Threads
```ts
Thread {
  id, type, seedEvent, beats[], tension, state
}
```
- Initiate on: enemy escapes, near-death, found item with history
- Develop: beats surface on subsequent floors
- Resolve: climax encounter or abandoned/dormant

### Notable Encounters
- Some monsters get `aiSeed` with personality
- Disposition system (hostile/neutral/friendly)
- Dialog when player approaches non-hostile

### Engagement Tracking
- Dwell time on rooms/dialogs
- Dialog depth (exchanges before exit)
- Use to weight context sampling

### Cross-Run Persistence
- Player profile with history
- Unresolved threads carry forward
- Recurring NPCs/factions
- "The dungeon remembers"

## Design Pillars

1. **Works without AI** - Mechanical engine is complete on its own
2. **AI enriches, doesn't block** - Fallback to no-text if generation slow
3. **Casual-friendly** - Quick runs, auto-save, simple controls
4. **Depth available** - Longer runs unlock, threads compound, choices matter
