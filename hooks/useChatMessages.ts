'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/components/auth/AuthProvider';
import { encryptMessage, decryptMessage } from '@/lib/encryption';

export interface ChatMessage {
  id: string;
  content: string;
  sender: {
    uid: string;
    email: string;
    photoURL: string | null;
  };
  timestamp: Timestamp;
  attachmentUrl?: string;
}

export function useChatMessages(roomId?: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !roomId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, `rooms/${roomId}/messages`),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          content: data.content ? decryptMessage(data.content) : '',
          sender: data.sender,
          timestamp: data.timestamp || Timestamp.now(),
          attachmentUrl: data.attachmentUrl
        };
      }).reverse();
      
      setMessages(newMessages);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching messages:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, roomId]);

  const sendMessage = async (content: string, attachmentUrl: string = '', roomId: string) => {
    if (!user || !content) return;

    try {
      const encryptedContent = encryptMessage(content);
      await addDoc(collection(db, `rooms/${roomId}/messages`), {
        content: encryptedContent,
        sender: {
          uid: user.uid,
          email: user.email,
          photoURL: user.photoURL
        },
        timestamp: serverTimestamp(),
        attachmentUrl
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  return { messages, sendMessage, loading };
}