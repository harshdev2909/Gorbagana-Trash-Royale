import React, { useEffect, useState } from 'react';
import { useWalletContext } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const { publicKey } = useWalletContext();
  const [profile, setProfile] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (publicKey) {
      fetch(`http://localhost:3001/profile/${publicKey.toString()}`)
        .then(r => r.json())
        .then(data => {
          if (data) {
            setProfile(data);
            setUsername(data.username || '');
            setAvatarUrl(data.avatarUrl || '');
            setBio(data.bio || '');
          }
        });
    }
  }, [publicKey]);

  const handleSave = async () => {
    if (!publicKey || !username.trim()) {
      setStatus('Wallet and username are required.');
      return;
    }
    setStatus('Saving...');
    const res = await fetch('http://localhost:3001/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: publicKey.toString(),
        username,
        avatarUrl,
        bio,
      }),
    });
    if (res.ok) {
      setStatus('Profile saved!');
    } else {
      setStatus('Failed to save profile.');
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 bg-black/80 border-blue-500/30 p-8 rounded-lg">
      <h2 className="text-blue-400 font-bold text-2xl mb-4">Your Profile</h2>
      <div className="mb-4">
        <label className="block text-blue-300 mb-1">Username</label>
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="w-full bg-gray-800 text-white px-3 py-2 rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block text-blue-300 mb-1">Avatar URL</label>
        <input
          type="text"
          value={avatarUrl}
          onChange={e => setAvatarUrl(e.target.value)}
          className="w-full bg-gray-800 text-white px-3 py-2 rounded"
        />
        {avatarUrl && <img src={avatarUrl} alt="avatar" className="w-16 h-16 rounded-full mt-2" />}
      </div>
      <div className="mb-4">
        <label className="block text-blue-300 mb-1">Bio</label>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          className="w-full bg-gray-800 text-white px-3 py-2 rounded"
        />
      </div>
      <Button onClick={handleSave} className="bg-blue-500 hover:bg-blue-600">Save Profile</Button>
      {status && <div className="mt-4 text-blue-300">{status}</div>}
    </div>
  );
} 