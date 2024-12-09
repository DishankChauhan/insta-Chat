'use client';

import SimplePeer from 'simple-peer';
import { db } from '@/lib/firebase/config';
import { collection, doc, setDoc, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

export class VideoCallService {
  private peer: SimplePeer.Instance | null = null;
  private stream: MediaStream | undefined;
  private roomId: string | null = null;
  private unsubscribe: (() => void) | null = null;

  async startCall(userId: string, targetUserId: string): Promise<string> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.roomId = uuidv4();
      
      this.peer = new SimplePeer({
        initiator: true,
        stream: this.stream,
        trickle: false
      });

      // Create call room
      await setDoc(doc(db, 'calls', this.roomId), {
        offer: null,
        answer: null,
        initiator: userId,
        target: targetUserId,
        status: 'pending',
        timestamp: new Date()
      });

      // Handle signaling
      this.peer.on('signal', async (data) => {
        await updateDoc(doc(db, 'calls', this.roomId!), {
          offer: data
        });
      });

      // Set up room listener
      this.unsubscribe = onSnapshot(doc(db, 'calls', this.roomId), (snapshot) => {
        const data = snapshot.data();
        if (data?.answer) {
          this.peer?.signal(data.answer);
        }
      });

      return this.roomId;
    } catch (error) {
      console.error('Error starting call:', error);
      throw error;
    }
  }

  async joinCall(roomId: string, userId: string): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.roomId = roomId;

      const callDoc = doc(db, 'calls', roomId);
      
      this.unsubscribe = onSnapshot(callDoc, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          
          if (data.offer && !this.peer) {
            this.peer = new SimplePeer({
              initiator: false,
              stream: this.stream,
              trickle: false
            });

            this.peer.signal(data.offer);

            this.peer.on('signal', async (answer) => {
              await updateDoc(callDoc, { 
                answer,
                status: 'connected'
              });
            });
          }
        }
      });
    } catch (error) {
      console.error('Error joining call:', error);
      throw error;
    }
  }

  async endCall(): Promise<void> {
    if (this.peer) {
      this.peer.destroy();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    if (this.roomId) {
      await deleteDoc(doc(db, 'calls', this.roomId));
    }
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    
    this.peer = null;
    this.stream = undefined;
    this.roomId = null;
    this.unsubscribe = null;
  }

  onStream(callback: (stream: MediaStream) => void): void {
    if (this.peer) {
      this.peer.on('stream', callback);
    }
  }
}