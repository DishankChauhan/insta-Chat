'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { UserService, OnlineUser } from '@/lib/services/userService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Video } from 'lucide-react';

interface OnlineUsersProps {
  onStartCall: (userId: string) => void;
}

export function OnlineUsers({ onStartCall }: OnlineUsersProps) {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [userService] = useState(() => new UserService());

  useEffect(() => {
    if (!user) return;

    // Update user status when component mounts
    userService.updateUserStatus(user, 'online');

    // Watch for online users
    const unsubscribe = userService.watchOnlineUsers((users) => {
      // Filter out current user
      setOnlineUsers(users.filter(u => u.uid !== user.uid));
    });

    // Set up cleanup
    const handleBeforeUnload = () => userService.cleanup(user);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      userService.cleanup(user);
    };
  }, [user, userService]);

  return (
    <div className="w-64 bg-white/90 p-4 rounded-lg shadow-lg backdrop-blur-sm">
      <h3 className="text-lg font-semibold mb-4">Online Users</h3>
      <div className="space-y-3">
        {onlineUsers.map((onlineUser) => (
          <div key={onlineUser.uid} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={onlineUser.photoURL || undefined} />
                <AvatarFallback>
                  {onlineUser.displayName?.[0] || onlineUser.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm truncate max-w-[120px]">
                {onlineUser.displayName || onlineUser.email}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-primary/10"
              onClick={() => onStartCall(onlineUser.uid)}
            >
              <Video className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {onlineUsers.length === 0 && (
          <p className="text-sm text-muted-foreground text-center">No users online</p>
        )}
      </div>
    </div>
  );
}