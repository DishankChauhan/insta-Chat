'use client';

import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileIcon, ImageIcon } from 'lucide-react';
import { useState } from 'react';

interface MessageProps {
  content: string;
  sender: {
    uid: string;
    email: string;
    photoURL: string | null;
  };
  timestamp: Timestamp;
  isCurrentUser: boolean;
  attachmentUrl?: string;
}

export function Message({ content, sender, timestamp, isCurrentUser, attachmentUrl }: MessageProps) {
  const [imageError, setImageError] = useState(false);

  const getFormattedTime = (timestamp: Timestamp) => {
    try {
      return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'recently';
    }
  };

  const isImage = attachmentUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
        <Avatar className="h-8 w-8">
          <AvatarImage src={sender.photoURL || undefined} />
          <AvatarFallback>{sender.email?.[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className={`max-w-md ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg p-3`}>
          {attachmentUrl && (
            <div className="mb-2 overflow-hidden rounded-lg">
              {isImage && !imageError ? (
                <img
                  src={attachmentUrl}
                  alt="attachment"
                  className="max-h-[300px] w-auto object-contain"
                  onError={() => setImageError(true)}
                />
              ) : (
                <a
                  href={attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:underline"
                >
                  {isImage ? <ImageIcon className="h-4 w-4" /> : <FileIcon className="h-4 w-4" />}
                  <span>View Attachment</span>
                </a>
              )}
            </div>
          )}
          <p className="break-words">{content}</p>
          <span className="mt-1 block text-xs opacity-70">
            {getFormattedTime(timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}