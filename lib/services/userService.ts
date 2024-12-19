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
  serverTimestamp,
  getDocs,
  Timestamp,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { OnlineUser, UserDocument, UserStatus, BaseUser } from '@/lib/types/user';
import { HeartbeatService } from './heartbeatService';

export class UserService {
  private userStatusRef: any;
  private unsubscribe: (() => void) | null = null;
  private heartbeatService: HeartbeatService;

  constructor() {
    this.heartbeatService = new HeartbeatService();
  }

  async updateUserStatus(user: User, status: 'online' | 'offline') {
    if (!user) return;

    try {
      await this.cleanupStaleUsers();

      this.userStatusRef = doc(db, 'users', user.uid);
      const userData: UserStatus = {
        status,
        lastSeen: Timestamp.now().toDate(),
        heartbeat: Timestamp.now().toDate()
      };

      const baseUserData: BaseUser = {
        email: user.email || '',
        photoURL: user.photoURL,
        displayName: user.displayName,
        status,
        lastSeen: userData.lastSeen
      };

      await setDoc(this.userStatusRef, {
        ...baseUserData,
        heartbeat: userData.heartbeat
      }, { merge: true });

      if (status === 'online') {
        this.heartbeatService.startHeartbeat(user.uid);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  }

  private async cleanupStaleUsers() {
    try {
      const staleTime = new Date();
      staleTime.setMinutes(staleTime.getMinutes() - 1);

      const usersRef = collection(db, 'users');
      const staleUsersQuery = query(
        usersRef,
        where('status', '==', 'online'),
        where('heartbeat', '<', staleTime)
      );

      const staleUsers = await getDocs(staleUsersQuery);
      
      const promises = staleUsers.docs.map(doc => 
        updateDoc(doc.ref, {
          status: 'offline',
          lastSeen: serverTimestamp()
        })
      );

      await Promise.all(promises);
    } catch (error) {
      console.error('Error cleaning up stale users:', error);
    }
  }

  private mapDocToUser(doc: QueryDocumentSnapshot): OnlineUser {
    const data = doc.data() as UserDocument;
    return {
      uid: doc.id,
      email: data.email,
      photoURL: data.photoURL,
      displayName: data.displayName,
      status: data.status,
      lastSeen: data.lastSeen,
      heartbeat: data.heartbeat
    };
  }

  watchOnlineUsers(callback: (users: OnlineUser[]) => void) {
    const q = query(
      collection(db, 'users'),
      where('status', '==', 'online')
    );

    this.unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs
        .map(this.mapDocToUser)
        .filter(user => {
          const heartbeat = user.heartbeat;
          if (!heartbeat) return false;
          const staleTime = new Date();
          staleTime.setMinutes(staleTime.getMinutes() - 1);
          return heartbeat > staleTime;
        });
      
      callback(users);
    });

    return () => {
      if (this.unsubscribe) {
        this.unsubscribe();
      }
    };
  }

  async cleanup(user: User) {
    try {
      this.heartbeatService.stopHeartbeat();

      if (user && this.userStatusRef) {
        await updateDoc(this.userStatusRef, {
          status: 'offline',
          lastSeen: serverTimestamp()
        });
      }

      if (this.unsubscribe) {
        this.unsubscribe();
      }
    } catch (error) {
      console.error('Error cleaning up user service:', error);
    }
  }
}

export type { OnlineUser };