'use client';

import { db } from '@/lib/firebase/config';
import { 
  collection, 
  doc, 
  setDoc,
  getDoc,
  getDocs,
  query, 
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { slugify } from '@/lib/utils';

export interface ChatRoom {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Date;
  members: string[];
  lastMessage?: {
    content: string;
    sender: string;
    timestamp: Date;
  };
}

export class RoomService {
  private roomsUnsubscribe: (() => void) | null = null;
  private currentRoomUnsubscribe: (() => void) | null = null;

  async createRoom(name: string, creator: User): Promise<string> {
    const roomId = slugify(name); // Convert room name to URL-friendly ID
    const roomRef = doc(db, 'rooms', roomId);
    
    // Check if room already exists
    const roomDoc = await getDoc(roomRef);
    if (roomDoc.exists()) {
      throw new Error('A room with this name already exists');
    }
    
    const roomData = {
      id: roomId,
      name,
      createdBy: creator.uid,
      createdAt: serverTimestamp(),
      members: [creator.uid],
      lastMessage: null
    };
    
    await setDoc(roomRef, roomData);
    return roomId;
  }

  async joinRoom(roomId: string, user: User): Promise<void> {
    const roomRef = doc(db, 'rooms', roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }

    const roomData = roomDoc.data();
    if (!roomData.members.includes(user.uid)) {
      await updateDoc(roomRef, {
        members: [...roomData.members, user.uid]
      });
    }
  }

  async getRoomById(roomId: string): Promise<ChatRoom | null> {
    const roomRef = doc(db, 'rooms', roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (!roomDoc.exists()) {
      return null;
    }

    return {
      id: roomDoc.id,
      ...roomDoc.data()
    } as ChatRoom;
  }

  watchUserRooms(userId: string, callback: (rooms: ChatRoom[]) => void): () => void {
    const q = query(
      collection(db, 'rooms'),
      where('members', 'array-contains', userId),
      orderBy('createdAt', 'desc')
    );

    this.roomsUnsubscribe = onSnapshot(q, (snapshot) => {
      const rooms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatRoom[];
      callback(rooms);
    });

    return () => {
      if (this.roomsUnsubscribe) {
        this.roomsUnsubscribe();
      }
    };
  }

  watchRoom(roomId: string, callback: (room: ChatRoom) => void): () => void {
    const roomRef = doc(db, 'rooms', roomId);
    
    this.currentRoomUnsubscribe = onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({
          id: snapshot.id,
          ...snapshot.data()
        } as ChatRoom);
      }
    });

    return () => {
      if (this.currentRoomUnsubscribe) {
        this.currentRoomUnsubscribe();
      }
    };
  }

  cleanup(): void {
    if (this.roomsUnsubscribe) {
      this.roomsUnsubscribe();
    }
    if (this.currentRoomUnsubscribe) {
      this.currentRoomUnsubscribe();
    }
  }
}