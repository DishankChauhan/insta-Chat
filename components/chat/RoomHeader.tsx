'use client';

import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface RoomHeaderProps {
  roomId: string;
  roomName: string;
}

export function RoomHeader({ roomId, roomName }: RoomHeaderProps) {
  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    toast.success('Room ID copied to clipboard');
  };

  return (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
          {roomName}
        </h2>
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">Room ID: {roomId}</p>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={copyRoomId}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}