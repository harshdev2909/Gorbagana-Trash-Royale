# Trash Royale

## Overview
Trash Royale is a real-time, multiplayer battle royale game built on Solana (Gorbagana testnet/devnet). Compete in dynamic arenas, use SOL or GORB tokens for entry and upgrades, and climb the leaderboard. The game features public/private lobbies, tournaments, real-time chat, and a persistent leaderboard and match history.

## Features
- Real-time multiplayer battle arena
- Public, private, and tournament lobbies
- SOL and GORB (SPL token) payments for entry, upgrades, and rewards
- Upgrades: shields, health, speed, damage
- Live leaderboard, match history, and user profiles
- Real-time chat and kill feed
- Arena shrinking mechanic
- WebSocket-powered live events

## Gorbagana/Solana Integration
- **Wallet:** Connect with Phantom or compatible Solana wallets
- **Payments:** Entry fees and upgrades use SOL or GORB tokens
- **Rewards:** Winners receive payouts from the backend treasury wallet
- **Backend:** Uses Solana web3.js and SPL Token libraries
- **Keypair:** Backend treasury keypair is securely provided via environment variable (`TREASURY_KEYPAIR`)

## How to Play
1. Connect your Solana wallet
2. Choose a lobby (public, private, or tournament)
3. Pay the entry fee (SOL or GORB)
4. Move with WASD/arrow keys, survive as the arena shrinks
5. Buy upgrades to boost your chances
6. Last player standing wins rewards!

See the in-game "How to Play" page for more details.

## Setup & Deployment

### Prerequisites
- Node.js 18+
- Yarn or npm
- Solana CLI (for keypair generation)

### 1. Clone the Repo
```
git clone https://github.com/harshdev2909/Gorbagana-Trash-Royale.git
cd Gorbagana-Trash-Royale
```

### 2. Backend Setup
```
cd backend
npm install
```
- Create a Solana keypair for the treasury wallet:
  ```
  solana-keygen new --outfile treasury.json
  ```
- **Production:** Set the `TREASURY_KEYPAIR` environment variable to the contents of `treasury.json` (do NOT commit this file).
- Start the backend:
  ```
  npm start
  ```
- The backend runs on `http://localhost:3001` (or your deployed URL).

### 3. Frontend Setup
```
cd ../frontend
npm install
```
- Update API/WebSocket URLs in the code or via environment variables if needed.
- Start the frontend:
  ```
  npm run dev
  ```
- The frontend runs on `http://localhost:3000` (or your deployed URL).

### 4. Environment Variables
- **Backend:**
  - `TREASURY_KEYPAIR` — JSON array of the Solana treasury wallet
- **Frontend:**
  - (Optional) `NEXT_PUBLIC_BACKEND_URL` — Set if you want to configure backend URL via env

### 5. Deployment
- Deploy backend to Render, Heroku, or similar (set env vars securely)
- Deploy frontend to Vercel, Netlify, or similar
- Set CORS in backend to allow your frontend URL

## Contribution
Pull requests and issues are welcome! For major changes, open an issue first to discuss what you'd like to change.

## Contact
- [Project Website](https://trash-royale.vercel.app/)
- [Backend API](https://trash-royale.onrender.com/)
- [Author](https://github.com/harshdev2909) 