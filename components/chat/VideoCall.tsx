'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { VideoCallService } from '@/lib/services/videoCall';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';
import { Loader2, Video, VideoOff, Mic, MicOff, PhoneOff } from 'lucide-react';

interface VideoCallProps {
  roomId?: string;
  targetUserId: string;
  onEndCall: () => void;
}

export function VideoCall({ roomId, targetUserId, onEndCall }: VideoCallProps) {
  const { user } = useAuth();
  const [videoCallService] = useState(() => new VideoCallService());
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const initializeCall = async () => {
      if (!user) return;

      try {
        setIsConnecting(true);
        if (roomId) {
          await videoCallService.joinCall(roomId, user.uid);
          toast.success('Joined video call');
        } else {
          const newRoomId = await videoCallService.startCall(user.uid, targetUserId);
          toast.success('Started video call');
        }

        // Set up local video stream
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Handle remote stream
        videoCallService.onStream((remoteStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            setIsConnecting(false);
          }
        });
      } catch (error) {
        console.error('Error in video call:', error);
        toast.error('Failed to establish video call');
        onEndCall();
      }
    };

    initializeCall();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      videoCallService.endCall();
    };
  }, [user, roomId, targetUserId, videoCallService, onEndCall]);

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isAudioEnabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="container flex h-full items-center justify-center">
        <div className="relative w-full max-w-4xl">
          <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
            {isConnecting && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Connecting...</span>
              </div>
            )}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute bottom-4 right-4 aspect-video h-32 overflow-hidden rounded-lg bg-muted shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={toggleVideo}
              className={!isVideoEnabled ? 'bg-destructive text-destructive-foreground' : ''}
            >
              {isVideoEnabled ? (
                <Video className="h-4 w-4" />
              ) : (
                <VideoOff className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={toggleAudio}
              className={!isAudioEnabled ? 'bg-destructive text-destructive-foreground' : ''}
            >
              {isAudioEnabled ? (
                <Mic className="h-4 w-4" />
              ) : (
                <MicOff className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                videoCallService.endCall();
                onEndCall();
              }}
            >
              <PhoneOff className="h-4 w-4 mr-2" />
              End Call
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}