import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Book, Trophy, Users, Coins, Sword, Shield, Zap, MessageCircle } from "lucide-react";

export default function HowToPlayPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-28 pb-12 px-4 bg-black/90">
      <Card className="max-w-3xl w-full mx-auto p-8 bg-black/80 border-green-500/30 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <Book className="w-8 h-8 text-green-400" />
          <h1 className="text-4xl font-black text-green-300">How to Play Trash Royale</h1>
        </div>
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-green-400 mb-2">Overview</h2>
          <p className="text-gray-200 text-lg">
            <b>Trash Royale</b> is a real-time, multiplayer battle arena game built on Solana. Compete against other players for rewards, upgrades, and leaderboard glory! Use your skills, strategy, and quick reflexes to survive and become the last trash standing.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-green-400 mb-2">How to Play</h2>
          <ul className="list-disc pl-6 text-gray-200 text-lg space-y-2">
            <li>Connect your Solana wallet to join the game.</li>
            <li>Choose a lobby: public, private, or tournament mode.</li>
            <li>Pay the entry fee in SOL or GORB tokens to enter a match.</li>
            <li>Once in the arena, use your keyboard (WASD or arrow keys) to move your player.</li>
            <li>Survive as the arena shrinks and other players compete to eliminate each other.</li>
            <li>Buy upgrades (shields, health, speed, damage) using GORB during the match to boost your chances.</li>
            <li>Chat with other players in real time and keep an eye on the kill feed and mini-map.</li>
            <li>The last player alive wins the match and earns rewards!</li>
          </ul>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-green-400 mb-2">Game Rules</h2>
          <ul className="list-disc pl-6 text-gray-200 text-lg space-y-2">
            <li>Each match starts with all players at full health and shields.</li>
            <li>The arena shrinks over time, forcing players closer together.</li>
            <li>Move to avoid the danger zone and stay within the safe area.</li>
            <li>Use upgrades wisely—timing and resource management are key.</li>
            <li>Eliminated players are removed from the match, but can spectate or chat.</li>
            <li>Cheating, exploiting, or toxic behavior is not tolerated and may result in bans.</li>
          </ul>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-green-400 mb-2">Features</h2>
          <ul className="grid grid-cols-2 gap-4 text-gray-200 text-lg">
            <li className="flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-400" /> Leaderboards & Match History</li>
            <li className="flex items-center gap-2"><Users className="w-5 h-5 text-blue-400" /> Public & Private Lobbies</li>
            <li className="flex items-center gap-2"><Coins className="w-5 h-5 text-gold-400" /> SOL & GORB Payments</li>
            <li className="flex items-center gap-2"><Sword className="w-5 h-5 text-red-400" /> Real-Time Battle Arena</li>
            <li className="flex items-center gap-2"><Shield className="w-5 h-5 text-blue-400" /> Upgrades & Power-Ups</li>
            <li className="flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-300" /> Arena Shrinking Mechanic</li>
            <li className="flex items-center gap-2"><MessageCircle className="w-5 h-5 text-purple-400" /> Real-Time Chat</li>
          </ul>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-green-400 mb-2">Tips for Success</h2>
          <ul className="list-disc pl-6 text-gray-200 text-lg space-y-2">
            <li>Stay near the center as the arena shrinks to avoid sudden elimination.</li>
            <li>Use upgrades at the right moment—timing can turn the tide of battle.</li>
            <li>Watch the mini-map and keep track of other players' positions.</li>
            <li>Communicate and strategize with teammates in private lobbies.</li>
            <li>Check the leaderboard to track your progress and aim for the top!</li>
          </ul>
        </section>
      </Card>
    </div>
  );
} 