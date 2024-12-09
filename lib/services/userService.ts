'use client';

import { db } from '@/lib/firebase/config';
import { 
  collection, 
  doc, 
  setDoc, 
  query, 
  where, 
  onSnapshot,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { User } from 'firebase/auth';

export interface OnlineUser {
  uid: string;
  email: string;
  photoURL: string | null;
  displayName: string | null;
  status: 'online' | 'offline';
  lastSeen: Date;
}

export class UserService {
  private userStatusRef: any;
  private unsubscribe: (() => void) | null = null;

  async updateUserStatus(user: User, status: 'online' | 'offline') {
    if (!user) return;

    this.userStatusRef = doc(db, 'users', user.uid);
    await setDoc(this.userStatusRef, {
      email: user.email,
      photoURL: user.photoURL,
      displayName: user.displayName,
      status,
      lastSeen: serverTimestamp()
    }, { merge: true });
  }

  watchOnlineUsers(callback: (users: OnlineUser[]) => void) {
    const q = query(
      collection(db, 'users'),
      where('status', '==', 'online')
    );

    this.unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as OnlineUser[];
      callback(users);
    });

    return () => {
      if (this.unsubscribe) {
        this.unsubscribe();
      }
    };
  }

  async cleanup(user: User) {
    if (user && this.userStatusRef) {
      await updateDoc(this.userStatusRef, {
        status: 'offline',
        lastSeen: serverTimestamp()
      });
    }
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}