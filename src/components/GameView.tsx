'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, RUN_CONFIGS, Position } from '@/engine/types';
import { createNewGame, processPlayerMove, processPlayerClick, MoveDirection } from '@/engine/state';
import { Grid } from './Grid';
import { Status } from './Status';

export function GameView() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedSize, setSelectedSize] = useState<'quick' | 'short' | 'medium'>('quick');
  const lastProcessedTurn = useRef<number>(-1);

  const startNewGame = useCallback(() => {
    const config = RUN_CONFIGS[selectedSize];
    const state = createNewGame(config);
    lastProcessedTurn.current = -1;
    setGameState(state);
  }, [selectedSize]);

  // Move handler that prevents double-processing
  const handleMove = useCallback((direction: MoveDirection) => {
    setGameState((prev) => {
      if (!prev || prev.status !== 'playing') return prev;
      // Prevent double-processing same turn (React StrictMode)
      if (prev.turn === lastProcessedTurn.current) return prev;
      lastProcessedTurn.current = prev.turn;

      const newState = { ...prev };
      processPlayerMove(newState, direction);
      return { ...newState };
    });
  }, []);

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      let direction: MoveDirection | null = null;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          direction = 'up';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          direction = 'down';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          direction = 'left';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          direction = 'right';
          break;
      }

      if (direction) {
        e.preventDefault();
        handleMove(direction);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove]);

  const handleTileClick = useCallback((pos: Position) => {
    setGameState((prev) => {
      if (!prev || prev.status !== 'playing') return prev;
      const newState = { ...prev };
      processPlayerClick(newState, pos);
      return { ...newState };
    });
  }, []);

  // Start screen
  if (!gameState) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center space-y-8 p-8">
          <h1 className="text-4xl font-bold text-amber-400">Rogulator</h1>
          <p className="text-gray-400">A roguelike adventure</p>

          <div className="space-y-4">
            <div className="text-sm text-gray-400">Select run size:</div>
            <div className="flex gap-2 justify-center">
              {(['quick', 'short', 'medium'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 rounded capitalize ${
                    selectedSize === size
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-500">
              {selectedSize === 'quick' && '1 floor, ~5 rooms - The grocery run'}
              {selectedSize === 'short' && '3 floors, ~15 rooms - A quick delve'}
              {selectedSize === 'medium' && '6 floors, ~30 rooms - A proper adventure'}
            </div>
          </div>

          <button
            onClick={startNewGame}
            className="px-8 py-3 bg-green-600 hover:bg-green-500 rounded text-lg font-semibold transition"
          >
            Start Game
          </button>

          <div className="text-xs text-gray-500 mt-8">
            <p>Move: Arrow keys or WASD</p>
            <p>Attack: Bump into enemies</p>
            <p>Goal: Find the macguffin and escape!</p>
          </div>
        </div>
      </div>
    );
  }

  // Game screen
  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-amber-400">Rogulator</h1>
          <button
            onClick={startNewGame}
            className="px-4 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm"
          >
            New Game
          </button>
        </div>

        {/* Main game area - responsive layout */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Grid */}
          <div className="flex-shrink-0">
            <Grid
              floor={gameState.floor}
              player={gameState.player}
              onTileClick={handleTileClick}
            />
          </div>

          {/* Status panel */}
          <Status
            player={gameState.player}
            turn={gameState.turn}
            status={gameState.status}
            messages={gameState.messages}
            macguffin={gameState.floor.macguffin}
          />
        </div>

        {/* Mobile controls */}
        <div className="md:hidden grid grid-cols-3 gap-2 w-48 mx-auto">
          <div />
          <button
            onClick={() => handleMove('up')}
            className="p-4 bg-gray-800 rounded text-2xl active:bg-gray-600"
          >
            ↑
          </button>
          <div />
          <button
            onClick={() => handleMove('left')}
            className="p-4 bg-gray-800 rounded text-2xl active:bg-gray-600"
          >
            ←
          </button>
          <div className="p-4 bg-gray-900 rounded text-center text-yellow-400">@</div>
          <button
            onClick={() => handleMove('right')}
            className="p-4 bg-gray-800 rounded text-2xl active:bg-gray-600"
          >
            →
          </button>
          <div />
          <button
            onClick={() => handleMove('down')}
            className="p-4 bg-gray-800 rounded text-2xl active:bg-gray-600"
          >
            ↓
          </button>
          <div />
        </div>
      </div>
    </div>
  );
}
