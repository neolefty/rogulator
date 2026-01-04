# Rogulator

An AI-enhanced roguelike where narrative emerges from play.

## Quick Start

```bash
npm install
cp .env.example .env.local  # Add API keys (optional)
npm run dev
```

## What Is This

A turn-based dungeon crawler with a twist: an AI layer ("The Loom") weaves narrative around the mechanical gameplay. The game works without AI, but with it, rooms get atmospheric descriptions, combat gets narration, and monsters can have personalities and histories.

**Current state**: Playable MVP with core mechanics. AI hooks scaffolded but not yet wired in.

## Controls

- **Move**: WASD or Arrow keys
- **Rest**: Space or Period (heals faster)
- **Attack**: Bump into enemies

## Docs

- [ARCHITECTURE.md](./ARCHITECTURE.md) - How it's built, design decisions
- [ROADMAP.md](./ROADMAP.md) - What's done, what's next

## Stack

- Next.js 14 + TypeScript
- Zustand (state with localStorage persistence)
- Vercel AI SDK (Anthropic, OpenAI, Google support)
- Tailwind CSS
