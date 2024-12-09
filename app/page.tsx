'use client';

import { useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Scene } from '@/components/3d/Scene';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { SignIn } from '@/components/auth/SignIn';
import { MessageCircle, Users, Video, Shield } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const scrollContainer = useRef<HTMLDivElement>(null);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <main className="relative w-full">
      <div className="fixed inset-0 z-0">
        <Scene scrollContainer={scrollContainer} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />
      </div>
      
      <div 
        ref={scrollContainer}
        className="relative z-10 min-h-screen snap-y snap-mandatory overflow-y-scroll"
      >
        <section className="flex h-screen snap-start items-center justify-center">
          <div className="max-w-4xl px-4 text-center">
            <h1 className="mb-6 text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-600 to-blue-600">
              Welcome to instaChat
            </h1>
            <p className="mb-8 text-2xl text-muted-foreground">
              {user ? 'Scroll down to start chatting' : 'Sign in to start chatting'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
              <div className="p-6 rounded-xl bg-card/80 backdrop-blur transform hover:scale-105 transition-transform">
                <MessageCircle className="w-12 h-12 mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Real-time Chat</h3>
                <p className="text-muted-foreground">
                  Instant messaging with persistent history
                </p>
              </div>
              <div className="p-6 rounded-xl bg-card/80 backdrop-blur transform hover:scale-105 transition-transform">
                <Video className="w-12 h-12 mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Video Calls</h3>
                <p className="text-muted-foreground">
                  Face-to-face conversations in HD
                </p>
              </div>
              <div className="p-6 rounded-xl bg-card/80 backdrop-blur transform hover:scale-105 transition-transform">
                <Users className="w-12 h-12 mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Group Chats</h3>
                <p className="text-muted-foreground">
                  Create and join persistent chat rooms
                </p>
              </div>
              <div className="p-6 rounded-xl bg-card/80 backdrop-blur transform hover:scale-105 transition-transform">
                <Shield className="w-12 h-12 mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Secure</h3>
                <p className="text-muted-foreground">
                  End-to-end encrypted messaging
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen snap-start items-center justify-center p-4 bg-gradient-to-b from-background/50 to-background">
          {user ? <ChatInterface /> : <SignIn />}
        </section>
      </div>
    </main>
  );
}