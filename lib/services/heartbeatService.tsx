'use client';

import { db } from '@/lib/firebase/config';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export class HeartbeatService {
  private heartbeatInterval: NodeJS.Timeout | null = null;

  startHeartbeat(userId: string) {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(async () => {
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          heartbeat: serverTimestamp()
        });
      } catch (error) {
        console.error('Error updating heartbeat:', error);
      }
    }, 30000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}