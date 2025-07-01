import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';

dotenv.config();

// Use Gorbagana RPC directly
const connection = new Connection('https://rpc.gorbagana.wtf/', 'confirmed');

// Load treasury keypair from env or file
const treasury = process.env.TREASURY_KEYPAIR
  ? JSON.parse(process.env.TREASURY_KEYPAIR)
  : JSON.parse(fs.readFileSync('./treasury.json', 'utf8'));

const router = express.Router();

export async function sendSol(to, amount) {
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: treasury.publicKey,
      toPubkey: new PublicKey(to),
      lamports: Math.round(amount * LAMPORTS_PER_SOL),
    })
  );
  const signature = await sendAndConfirmTransaction(connection, tx, [treasury]);
  return signature;
}

router.post('/claim-sol-reward', async (req, res) => {
  try {
    const { winnerAddress, amount } = req.body;
    if (!winnerAddress || !amount) return res.status(400).json({ error: 'Missing params' });

    const toPubkey = new PublicKey(winnerAddress);
    const lamports = Math.round(Number(amount) * 1e9);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: treasury.publicKey,
        toPubkey: toPubkey,
        lamports: lamports,
      })
    );

    const signature = await connection.sendTransaction(transaction, [treasury]);
    await connection.confirmTransaction(signature, 'confirmed');

    res.json({ signature });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export { router };
