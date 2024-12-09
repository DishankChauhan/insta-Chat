'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { RoomService, ChatRoom } from '@/lib/services/roomService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Hash } from 'lucide-react';

interface ChatRoomsProps {
  onSelectRoom: (roomId: string) => void;
  selectedRoomId?: string;
}

export function ChatRooms({ onSelectRoom, selectedRoomId }: ChatRoomsProps) {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [roomService] = useState(() => new RoomService());

  useEffect(() => {
    if (!user) return;

    const unsubscribe = roomService.watchUserRooms(user.uid, (updatedRooms) => {
      setRooms(updatedRooms);
    });

    return () => {
      unsubscribe();
      roomService.cleanup();
    };
  }, [user, roomService]);

  const handleCreateRoom = async () => {
    if (!user || !newRoomName.trim()) return;

    try {
      const roomId = await roomService.createRoom(newRoomName.trim(), user);
      setNewRoomName('');
      onSelectRoom(roomId);
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  return (
    <div className="w-64 bg-white/90 p-4 rounded-lg shadow-lg backdrop-blur-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Chat Rooms</h3>
        <div className="flex gap-2">
          <Input
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder="New room name"
            className="flex-1"
            onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
          />
          <Button size="icon" onClick={handleCreateRoom}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => onSelectRoom(room.id)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
              selectedRoomId === room.id
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            <Hash className="h-4 w-4" />
            <span className="truncate">{room.name}</span>
          </button>
        ))}
        {rooms.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            No rooms yet
          </p>
        )}
      </div>
    </div>
  );
}