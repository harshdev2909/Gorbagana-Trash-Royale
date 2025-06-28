import { MongoClient } from 'mongodb';
const uri = process.env.MONGO_URI || 'mongodb+srv://harshdev2909:harsh9560@cluster0.p53fxm9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri);
export const db = client.db('trashroyale');
export async function connectDB() { if (!client.topology?.isConnected()) await client.connect(); }
