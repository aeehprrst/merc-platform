"use client";

import { useEffect, useState, use } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';

export default function ChatWindow({
  params,
}: {
  params: Promise<{ campus: string, chatId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Authenticate and load initial messages
    const initializeChat = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUserId(session.user.id);

      // Fetch existing history
      const { data: history } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', resolvedParams.chatId)
        .order('created_at', { ascending: true });

      if (history) setMessages(history);
      setLoading(false);

      // 2. The WebSocket Connection (Listen for incoming messages)
      const channel = supabase
        .channel(`chat-${resolvedParams.chatId}`) // Subscribe to this specific chat room
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `chat_id=eq.${resolvedParams.chatId}`, // Only listen to messages for this chat
          },
          (payload) => {
             // When a new message hits the database, instantly add it to the screen!
             setMessages((current) => [...current, payload.new]);
          }
        )
        .subscribe();

      // Cleanup listener when you leave the page
      return () => {
        supabase.removeChannel(channel);
      };
    };

    initializeChat();
  }, [resolvedParams.chatId, router]);

  // 3. Send a new message to the database
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId) return;

    const messageText = newMessage;
    setNewMessage(''); // Clear input instantly for better UX

    await supabase
      .from('messages')
      .insert([
        {
          chat_id: resolvedParams.chatId,
          sender_id: userId,
          content: messageText,
        }
      ]);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center pt-32">Connecting to secure chat...</div>;

  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-50 pt-32 px-4 md:px-0">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-sm h-[70vh] flex flex-col overflow-hidden">
        
        {/* Chat Header */}
        <div className="bg-slate-900 text-white p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-lg">Secure Channel</h2>
            <p className="text-slate-400 text-sm">End-to-End Encrypted via M.E.R.C. Protocol</p>
          </div>
          <button 
            onClick={() => router.push(`/${resolvedParams.campus}`)}
            className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
          >
            ← Back to Hub
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50 flex flex-col gap-4">
          {messages.length === 0 ? (
            <div className="text-center text-slate-400 my-auto text-sm">
              This is the start of your secure conversation.
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.sender_id === userId;
              return (
                <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[75%] p-4 rounded-2xl ${
                      isMe 
                        ? 'bg-indigo-600 text-white rounded-br-sm shadow-sm' 
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message securely..."
              className="flex-1 bg-slate-100 border border-slate-200 rounded-full px-6 py-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm"
            />
            <button 
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-indigo-600 text-white px-6 py-3 rounded-full font-bold hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>

      </div>
    </main>
  );
}