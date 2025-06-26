const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Connection, PublicKey, Keypair, web3 } = require('@solana/web3.js');
const { Program, AnchorProvider } = require('@coral-xyz/anchor');
const { TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const idl = require('./solana-program/gorbagana-blitz/target/idl/gorbagana_blitz.json'); // Updated to match the file in backend/

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Configuration
const JWT_SECRET = 'your-secret-key'; // Replace with a secure key
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
// Using the secret key from your current file
const wallet = Keypair.fromSecretKey(Uint8Array.from([187, 227, 220, 193, 143, 73, 151, 4, 118, 104, 208, 184, 254, 221, 103, 69, 181, 230, 223, 54, 142, 145, 17, 146, 85, 82, 54, 132, 49, 72, 136, 43, 112, 49, 34, 184, 172, 75, 245, 45, 95, 21, 35, 178, 51, 232, 105, 121, 177, 180, 222, 106, 165, 172, 107, 252, 102, 39, 128, 75, 107, 74, 76, 193]));
const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
const programId = new PublicKey('4pNuGEBPFt8WnNzrqUyHJveRCZTBBSFXYttNNPgnj1Jb');
const program = new Program(idl, programId, provider, { accountSize: 96 });
// Middleware for authentication
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    jwt.verify(token.split(' ')[1], JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// Register a new player
app.post('/api/register', async (req, res) => {
    const { playerId } = req.body;
    if (!playerId) return res.status(400).json({ error: 'Player ID required' });

    try {
        const [playerPda, bump] = await PublicKey.findProgramAddress(
            [Buffer.from(playerId)],
            programId
        );
        await program.methods.initializePlayer(playerId, bump)
            .accounts({
                player: playerPda,
                signer: wallet.publicKey,
                systemProgram: web3.SystemProgram.programId,
            })
            .rpc();
        const token = jwt.sign({ playerId, pda: playerPda.toBase58() }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ success: true, token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update player score
app.post('/api/score', authenticateToken, async (req, res) => {
    const { playerId, pda } = req.user;
    const { score } = req.body;
    if (!score || typeof score !== 'number') return res.status(400).json({ error: 'Valid score required' });

    try {
        await program.methods.updateScore(new web3.BN(score)) // Using BN for u64
            .accounts({
                player: new PublicKey(pda),
            })
            .rpc();
        res.json({ success: true, score });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Buy a power-up
app.post('/api/power-up', authenticateToken, async (req, res) => {
    const { playerId, pda } = req.user;
    const { powerUpType } = req.body;
    if (!powerUpType) return res.status(400).json({ error: 'Power-up type required' });

    try {
        await program.methods.buyPowerUp(powerUpType)
            .accounts({
                player: new PublicKey(pda),
                gorAccount: new PublicKey('CNuvXi47R9jgjTfP5t1nkSWzPDMEweWTLYAxFDTdYoAD'), // Player's $GOR account
                treasury: new PublicKey('BdmpkTAbBQYRq5WUHTTCbAKCE6HbeoSzLZu1inQRrzU6'), // Treasury $GOR account
                signer: wallet.publicKey,
                tokenProgram: TOKEN_PROGRAM_ID,
            })
            .rpc();
        res.json({ success: true, powerUp: powerUpType });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});