'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';
import { RoomService } from '@/lib/services/roomService';

interface JoinRoomProps {
  onJoin: (roomId: string) => void;
}

export function JoinRoom({ onJoin }: JoinRoomProps) {
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const roomService = new RoomService();

  const handleJoin = async () => {
    if (!user || !roomId.trim()) return;

    setLoading(true);
    try {
      await roomService.joinRoom(roomId, user);
      onJoin(roomId);
    } catch (error) {
      console.error('Error joining room:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        placeholder="Enter room ID"
        className="flex-1"
      />
      <Button onClick={handleJoin} disabled={loading}>
        {loading ? 'Joining...' : 'Join Room'}
      </Button>
    </div>
  );
}