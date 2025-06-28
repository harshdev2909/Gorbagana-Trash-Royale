# Trash Royale: Solana Multiplayer Game

## Game Description
Trash Royale is a real-time, multiplayer battle arena game built on the Solana blockchain, currently running on the Gorbagana testnet. Players join lobbies, compete in dynamic arenas, and use their skills to become the last trash standing. The game integrates native SOL payments for entry fees, upgrades, and rewards, providing a true play-to-earn experience.

### Key Features
- **Gorbagana Testnet Integration:** All blockchain interactions (payments, rewards) are live on the Gorbagana Solana testnet for fast, low-cost, and risk-free gameplay.
- **Multiplayer Lobbies:** Join public or private lobbies, see real-time player lists, and chat before the match starts.
- **Real-Time Arena Battles:** Move your character in a shrinking arena, avoid danger zones, and outlast your opponents.
- **SOL Payments:** Pay entry fees and buy upgrades using real SOL (on testnet). Claim SOL rewards for winning matches.
- **Upgrades & Power-ups:** Purchase health, shield, speed, and damage boosts during the match to gain an edge.
- **Dynamic Leaderboard:** Track top players, win rates, and match history, all backed by a MongoDB database.
- **User Profiles:** Set your username, avatar, and bio. Profiles are shown in the leaderboard and match history.
- **Spectator Mode & Betting:** Watch live matches, chat as a spectator, and place bets on who will win.
- **Animated Victory/Defeat Screens:** See your stats, rewards, and animated effects at the end of each match.
- **Sound Effects & Animations:** Enjoy immersive sound cues and animated reward breakdowns for a polished experience.
- **Secure Backend:** All SOL transfers are handled securely on the backend; private keys are never exposed to the frontend.

---

## Overview
Trash Royale is a Solana-powered multiplayer game featuring real-time arena battles, SOL payments, leaderboards, and more. The project is split into a backend (Node.js/Express) and a frontend (Next.js/React).

---

## Project Structure

- `backend/` — Node.js/Express API, Solana integration, WebSocket server
- `frontend/` — Next.js/React app, game UI, wallet integration

---

## Setup Instructions

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) (for wallet management)

### 1. Clone the Repository
```bash
git clone <https://github.com/harshdev2909/Gorbagana-Trash-Royale>
cd <https://github.com/harshdev2909/Gorbagana-Trash-Royale>
```

### 2. Backend Setup
```bash
cd backend
npm install
# Create .env and treasury.json as needed
# .env example:
# RPC_URL=https://rpc.gorbagana.wtf
npm start
```

- The backend runs on port 3001 by default.
- Ensure your treasury wallet (treasury.json) is funded on the target Solana network.

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
- The frontend runs on port 3000 by default.

---

## Solana Integration
- Uses [@solana/web3.js](https://solana-labs.github.io/solana-web3.js/) for blockchain operations.
- Backend handles SOL reward payouts via `/claim-sol-reward` endpoint.
- Update `RPC_URL` in backend `.env` to switch between Devnet, Gorbagana, or Mainnet.

---

## Usage
- Visit `http://localhost:3000` to play the game.
- Use a Solana wallet (e.g., Phantom) to connect and interact with the game.
- Play matches, earn rewards, and claim SOL payouts.

---

## Development Notes
- All sensitive files (`.env`, `treasury.json`, `node_modules/`) are gitignored.
- For local development, use Devnet or Gorbagana testnet.
- For production, ensure your treasury wallet is secure and funded.

---

## License
MIT 