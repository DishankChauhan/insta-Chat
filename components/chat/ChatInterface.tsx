'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useFileUpload } from '@/hooks/useFileUpload';
import { Send, Paperclip, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Message } from './Message';
import { VideoCall } from './VideoCall';
import { OnlineUsers } from './OnlineUsers';
import { ChatRooms } from './ChatRooms';
import { EmojiPicker } from './EmojiPicker';
import { FileUploadPreview } from './FileUploadPreview';
import { MessageLoader } from './MessageLoader';
import { RoomHeader } from './RoomHeader';
import { JoinRoom } from './JoinRoom';
import { RoomService } from '@/lib/services/roomService';
import { toast } from 'sonner';

export function ChatInterface() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>();
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const { messages, sendMessage, loading } = useChatMessages(selectedRoomId);
  const { file, setFile, uploadFile, fileInputRef } = useFileUpload();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [callRoomId, setCallRoomId] = useState<string | undefined>();
  const [targetUserId, setTargetUserId] = useState<string | undefined>();
  const roomService = new RoomService();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedRoomId) {
      const unsubscribe = roomService.watchRoom(selectedRoomId, (room) => {
        setSelectedRoom(room);
      });
      return () => unsubscribe();
    }
  }, [selectedRoomId]);

  const handleSendMessage = async () => {
    if (!user || !selectedRoomId || (!message && !file)) return;

    try {
      setUploading(true);
      let attachmentUrl = '';
      
      if (file) {
        attachmentUrl = await uploadFile(file);
      }

      await sendMessage(message || 'Shared a file', attachmentUrl, selectedRoomId);
      setMessage('');
      setFile(null);
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    setMessage((prev) => prev + emoji.native);
  };

  const startVideoCall = (userId: string) => {
    setTargetUserId(userId);
    setIsInCall(true);
  };

  return (
    <div className="flex w-full max-w-7xl gap-4">
      <div className="flex flex-col gap-4 w-80">
        <ChatRooms
          onSelectRoom={setSelectedRoomId}
          selectedRoomId={selectedRoomId}
        />
        <JoinRoom onJoin={setSelectedRoomId} />
        <OnlineUsers onStartCall={startVideoCall} />
      </div>
      
      <div className="flex-1 rounded-xl bg-white/90 p-6 shadow-2xl backdrop-blur-lg">
        {selectedRoom ? (
          <RoomHeader roomId={selectedRoom.id} roomName={selectedRoom.name} />
        ) : (
          <h2 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
            Select or Join a Room
          </h2>
        )}

        <div className="mb-4 h-[600px] overflow-y-auto rounded-lg bg-background/50 p-4 backdrop-blur">
          {selectedRoomId ? (
            <>
              {loading ? (
                <MessageLoader />
              ) : (
                messages.map((msg) => (
                  <Message
                    key={msg.id}
                    content={msg.content}
                    sender={msg.sender}
                    timestamp={msg.timestamp}
                    isCurrentUser={msg.sender.uid === user?.uid}
                    attachmentUrl={msg.attachmentUrl}
                  />
                ))
              )}
              {uploading && <MessageLoader />}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">
                Select a room to start chatting
              </p>
            </div>
          )}
        </div>

        {selectedRoomId && (
          <>
            <FileUploadPreview file={file} onRemove={() => setFile(null)} />
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*,application/pdf,.doc,.docx,.txt"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              <EmojiPicker onEmojiSelect={handleEmojiSelect} />
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-white/50"
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                disabled={uploading}
              />
              <Button onClick={handleSendMessage} disabled={uploading}>
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </>
        )}
      </div>

      {isInCall && targetUserId && (
        <VideoCall
          roomId={callRoomId}
          targetUserId={targetUserId}
          onEndCall={() => {
            setIsInCall(false);
            setCallRoomId(undefined);
            setTargetUserId(undefined);
          }}
        />
      )}
    </div>
  );
}