"use client"

import { BattleArena } from "@/components/battle-arena";
import { useGameContext } from "@/contexts/GameContext";

export default function ArenaPage() {
  const { currentMatch } = useGameContext();
  const isPrivateRoom = currentMatch && currentMatch.id && currentMatch.id !== 'public-lobby';

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-gray-900 to-black p-8">
      <div className="w-full max-w-4xl mt-8 mb-8 flex flex-col items-center space-y-4 z-20">
        {isPrivateRoom && (
          <div className="px-6 py-3 bg-black/80 rounded-lg border-2 border-purple-500 text-purple-300 text-lg font-bold shadow-lg">
            Room ID: <span className="font-mono text-white">{currentMatch.id}</span>
          </div>
        )}
        {isPrivateRoom && (
          <div className="px-4 py-2 bg-yellow-900/80 rounded-lg border border-yellow-500 text-yellow-300 text-md font-semibold shadow">
            Private Room Creation Fee: <span className="text-yellow-400 font-bold">0.01 SOL</span>
          </div>
        )}
      </div>
      <div className="w-full max-w-6xl flex flex-col items-center z-10">
        <BattleArena />
      </div>
    </div>
  );
}
