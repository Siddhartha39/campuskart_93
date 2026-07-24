import { useEffect, useState } from 'react';
import { AnonymousUser } from '../types/whisper';

interface ChatMessage {
  id: string;
  author: AnonymousUser;
  text: string;
  createdAt: string;
  direction: 'incoming' | 'outgoing';
}

const guest = (index: number): AnonymousUser => ({
  id: `chat-${index}`,
  displayName: `Whisperer${index}`,
  avatarSeed: `Whisperer${index}`,
  karma: 210 + index * 5,
  badges: ['Chat Ready', 'Campus Ally'],
  posts: 10 + index,
  comments: 18 + index * 2,
  online: true
});

const initialMessages: ChatMessage[] = [
  {
    id: 'chat-1',
    author: guest(1),
    text: 'Hey, anyone up for a quick anonymous study session?',
    createdAt: new Date().toISOString(),
    direction: 'incoming'
  },
  {
    id: 'chat-2',
    author: guest(0),
    text: 'Yes, I have a few questions about the placement form deadline.',
    createdAt: new Date().toISOString(),
    direction: 'outgoing'
  }
];

export const useAnonymousChat = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [online, setOnline] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isSocketReady] = useState(true);

  useEffect(() => {
    const ticker = setInterval(() => setTyping((current) => !current), 12000);
    return () => clearInterval(ticker);
  }, []);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    setMessages((current) => [
      ...current,
      {
        id: `chat-${Date.now()}`,
        author: guest(0),
        text,
        createdAt: new Date().toISOString(),
        direction: 'outgoing'
      }
    ]);
    setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: `chat-reply-${Date.now()}`,
          author: guest(1),
          text: 'Thanks for sharing — that helps a lot.',
          createdAt: new Date().toISOString(),
          direction: 'incoming'
        }
      ]);
    }, 1200);
  };

  return {
    isDrawerOpen,
    setIsDrawerOpen,
    messages,
    typing,
    online,
    isSocketReady,
    sendMessage
  };
};
