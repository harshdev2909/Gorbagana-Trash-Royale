import React, { useEffect, useRef, useState } from 'react';
import { useWalletContext } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';

// Use your backend for game WebSocket, not Solana RPC
const BACKEND_WS_URL = 'wss://trash-royale.onrender.com'; // Change to wss://your-backend-domain for production

export default function RealTimeChat() {
  const { publicKey } = useWalletContext();
  const [chatMessages, setChatMessages] = useState<{playerId: string, message: string, timestamp: number}[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(BACKEND_WS_URL);
    ws.current.onopen = () => {
      console.log('WebSocket connected for chat');
    };
    ws.current.onmessage = (event) => {
      try {
        const { event: evt, data } = JSON.parse(event.data);
        console.log('Received WS event:', evt, data);
        if (evt === 'chatMessage') {
          setChatMessages((msgs) => [...msgs, data]);
        }
      } catch (err) {
        console.error('Error parsing WS message:', err, event.data);
      }
    };
    ws.current.onerror = (err) => {
      console.error('WebSocket error:', err);
    };
    ws.current.onclose = () => {
      console.log('WebSocket closed for chat');
    };
    return () => ws.current?.close();
  }, []);

  const sendMessage = () => {
    if (ws.current && publicKey && newMsg.trim()) {
      const msg = {
        event: 'chatMessage',
        playerId: publicKey.toString(),
        data: { message: newMsg }
      };
      console.log('Sending chat message:', msg);
      ws.current.send(JSON.stringify(msg));
      setNewMsg('');
    } else {
      console.log('Cannot send message:', { ws: !!ws.current, publicKey, newMsg });
    }
  };

  return (
    <div className="bg-black/80 border-blue-500/30 p-4 rounded-lg max-w-md mx-auto mt-6">
      <h3 className="text-blue-400 font-bold mb-2">Real-Time Chat</h3>
      <div className="h-40 overflow-y-auto mb-2 space-y-1 text-xs bg-gray-900/50 p-2 rounded">
        {chatMessages.map((msg, i) => (
          <div key={i} className="text-gray-300">
            <span className="text-blue-400">{msg.playerId.slice(0, 6)}:</span> {msg.message}
            <span className="ml-2 text-gray-500">{new Date(msg.timestamp).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newMsg}
          onChange={e => setNewMsg(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Type message..."
          className="flex-1 bg-gray-800 text-white px-2 py-1 rounded text-xs"
        />
        <Button size="sm" onClick={sendMessage} className="bg-blue-500 hover:bg-blue-600 text-xs">
          Send
        </Button>
      </div>
    </div>
  );
} 