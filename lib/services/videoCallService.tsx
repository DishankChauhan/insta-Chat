'use client';

import SimplePeer from 'simple-peer';
import { db } from '@/lib/firebase/config';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  onSnapshot, 
  deleteDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

export class VideoCallService {
  private peer: SimplePeer.Instance | null = null;
  private stream: MediaStream | undefined;
  private roomId: string | null = null;
  private unsubscribe: (() => void) | null = null;

  async startCall(userId: string, targetUserId: string): Promise<string> {
    try {
      // Request media stream with error handling
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
      } catch (error) {
        console.error('Media access error:', error);
        throw new Error('Failed to access camera/microphone. Please check permissions.');
      }

      this.roomId = uuidv4();
      
      // Initialize peer with ICE servers for better connectivity
      this.peer = new SimplePeer({
        initiator: true,
        stream: this.stream,
        trickle: false,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });

      // Create call document with status tracking
      const callDoc = doc(db, 'calls', this.roomId);
      await setDoc(callDoc, {
        offer: null,
        answer: null,
        initiator: userId,
        target: targetUserId,
        status: 'initiating',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Handle peer signaling
      this.peer.on('signal', async (data) => {
        try {
          await updateDoc(callDoc, {
            offer: data,
            status: 'offering',
            updatedAt: serverTimestamp()
          });
        } catch (error) {
          console.error('Error updating offer:', error);
          this.handleCallError('Failed to send call offer');
        }
      });

      // Set up room listener with error handling
      this.unsubscribe = onSnapshot(callDoc, 
        (snapshot) => {
          const data = snapshot.data();
          if (data?.answer && this.peer) {
            try {
              this.peer.signal(data.answer);
              updateDoc(callDoc, { 
                status: 'connected',
                updatedAt: serverTimestamp()
              });
            } catch (error) {
              console.error('Error processing answer:', error);
              this.handleCallError('Failed to establish connection');
            }
          }
        },
        (error) => {
          console.error('Room listener error:', error);
          this.handleCallError('Lost connection to call room');
        }
      );

      return this.roomId;
    } catch (error) {
      console.error('Error starting call:', error);
      this.cleanup();
      throw error;
    }
  }

  async joinCall(roomId: string, userId: string): Promise<void> {
    try {
      // Verify call exists and user is allowed to join
      const callDoc = doc(db, 'calls', roomId);
      const callData = await getDoc(callDoc);
      
      if (!callData.exists()) {
        throw new Error('Call not found');
      }

      const call = callData.data();
      if (call.status === 'ended') {
        throw new Error('Call has ended');
      }

      if (call.target !== userId && call.initiator !== userId) {
        throw new Error('Not authorized to join this call');
      }

      // Request media stream
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      this.roomId = roomId;

      // Initialize peer connection
      this.peer = new SimplePeer({
        initiator: false,
        stream: this.stream,
        trickle: false,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });

      // Set up call listener
      this.unsubscribe = onSnapshot(callDoc, 
        async (snapshot) => {
          if (!snapshot.exists()) {
            this.handleCallError('Call has been ended');
            return;
          }

          const data = snapshot.data();
          if (data.offer && !this.peer?.connected) {
            try {
              this.peer?.signal(data.offer);

              // Send answer back
              this.peer?.on('signal', async (answer) => {
                await updateDoc(callDoc, {
                  answer,
                  status: 'connected',
                  updatedAt: serverTimestamp()
                });
              });
            } catch (error) {
              console.error('Error processing offer:', error);
              this.handleCallError('Failed to connect to call');
            }
          }
        },
        (error) => {
          console.error('Call listener error:', error);
          this.handleCallError('Lost connection to call');
        }
      );

      // Handle connection established
      this.peer.on('connect', () => {
        console.log('Peer connection established');
      });

    } catch (error) {
      console.error('Error joining call:', error);
      this.cleanup();
      throw error;
    }
  }

  private handleCallError(message: string) {
    this.cleanup();
    throw new Error(message);
  }

  async endCall(): Promise<void> {
    try {
      if (this.roomId) {
        const callDoc = doc(db, 'calls', this.roomId);
        await updateDoc(callDoc, {
          status: 'ended',
          updatedAt: serverTimestamp()
        });
        await deleteDoc(callDoc);
      }
    } catch (error) {
      console.error('Error ending call:', error);
    } finally {
      this.cleanup();
    }
  }

  private cleanup(): void {
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = undefined;
    }
    
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    
    this.roomId = null;
  }

  onStream(callback: (stream: MediaStream) => void): void {
    if (this.peer) {
      this.peer.on('stream', callback);
    }
  }

  onError(callback: (error: Error) => void): void {
    if (this.peer) {
      this.peer.on('error', callback);
    }
  }
}