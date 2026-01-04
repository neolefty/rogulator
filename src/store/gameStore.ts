// Zustand store for Rogulator game state

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, RunConfig, RUN_CONFIGS, Position } from '@/engine/types';
import { createNewGame, processPlayerMove, processPlayerClick, processPlayerRest, MoveDirection } from '@/engine/state';

type GameStore = {
  // State
  gameState: GameState | null;
  selectedSize: RunConfig['size'];

  // Actions
  setSelectedSize: (size: RunConfig['size']) => void;
  startNewGame: () => void;
  move: (direction: MoveDirection) => void;
  rest: () => void;
  clickTile: (position: Position) => void;
  clearSave: () => void;
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // Initial state
      gameState: null,
      selectedSize: 'quick',

      // Actions
      setSelectedSize: (size) => set({ selectedSize: size }),

      startNewGame: () => {
        const { selectedSize } = get();
        const config = RUN_CONFIGS[selectedSize];
        const gameState = createNewGame(config);
        set({ gameState });
      },

      move: (direction) => {
        const { gameState } = get();
        if (!gameState || gameState.status !== 'playing') return;

        // Mutate in place - Zustand handles this fine
        processPlayerMove(gameState, direction);
        // Spread to trigger re-render
        set({ gameState: { ...gameState } });
      },

      rest: () => {
        const { gameState } = get();
        if (!gameState || gameState.status !== 'playing') return;

        processPlayerRest(gameState);
        set({ gameState: { ...gameState } });
      },

      clickTile: (position) => {
        const { gameState } = get();
        if (!gameState || gameState.status !== 'playing') return;

        processPlayerClick(gameState, position);
        set({ gameState: { ...gameState } });
      },

      clearSave: () => set({ gameState: null }),
    }),
    {
      name: 'rogulator-save',
      // Only persist gameState, not UI preferences
      partialize: (state) => ({ gameState: state.gameState }),
    }
  )
);
