"use client";

import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState, useRef } from 'react';

export default function ChatWindow({
  params,
}: {
  params: Promise<{ campus: string; chatId: string }>;
}) {
  const resolvedParams = use(params);
  const { campus, chatId } = resolvedParams;
  const router = useRouter();

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [chatDetails, setChatDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // This reference helps us auto-scroll to the bottom!
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // We define the channel outside so the cleanup function can see it
    let channel: any;

    const initializeChat = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setCurrentUser(session.user);

      // 1. Fetch Chat & Item Details
      const { data: chatData } = await supabase
        .from('chats')
        .select('*, items(*, profiles:seller_id(full_name))')
        .eq('id', chatId)
        .single();
      
      setChatDetails(chatData);

      // 2. Fetch Initial Messages
      const { data: messageData } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (messageData) setMessages(messageData);
      setLoading(false);

      // 3. 🚨 THE REAL-TIME MAGIC (STABLE VERSION) 🚨
      channel = supabase
        .channel(`chat-${chatId}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `chat_id=eq.${chatId}` 
        }, (payload) => {
          setMessages((current) => {
            if (current.find(m => m.id === payload.new.id)) return current;
            return [...current, payload.new];
          });
        })
        .subscribe();
    };

    initializeChat();

    // THIS is where the cleanup function belongs!
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [chatId, router]);

  // Auto-scroll whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const textToSend = newMessage;
    const tempId = Date.now().toString(); // Temporary ID for the UI
    
    // 1. OPTIMISTIC UPDATE: Show the message immediately for the sender
    const optimisticMessage = {
      id: tempId,
      chat_id: chatId,
      sender_id: currentUser.id,
      text: textToSend,
      created_at: new Date().toISOString(),
    };

    setMessages((current) => [...current, optimisticMessage]);
    setNewMessage(''); // Clear input instantly
    scrollToBottom();

    // 2. SEND TO DATABASE
    const { error } = await supabase
      .from('messages')
      .insert([{ 
        chat_id: chatId, 
        sender_id: currentUser.id, 
        text: textToSend 
      }]);

    if (error) {
      console.error("Error sending message:", error);
      // Remove the optimistic message if it failed to save
      setMessages((current) => current.filter(m => m.id !== tempId));
      alert("Failed to send message. Please try again.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-medium">Loading secure chat...</div>;

  // Determine who we are talking to for the header
  const isSeller = currentUser?.id === chatDetails?.seller_id;
  const partnerName = isSeller ? "Interested Buyer" : (chatDetails?.items?.profiles?.full_name || "Seller");

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-slate-50 pt-28 pb-8 px-4 w-full">
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col h-[75vh] overflow-hidden">
        
        {/* --- HEADER --- */}
        <div className="bg-white border-b border-slate-100 p-4 shrink-0 flex items-center justify-between z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push(`/${campus}`)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors">
              ←
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{partnerName}</h1>
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Inquiry about: {chatDetails?.items?.title}
              </p>
            </div>
          </div>
        </div>

        {/* --- MESSAGE HISTORY --- */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-4 bg-slate-50/50">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <span className="text-4xl mb-2">👋</span>
              <p className="font-medium text-sm">Send a message to start the conversation.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === currentUser.id;
              return (
                <div key={msg.id} className={`flex flex-col max-w-[75%] ${isMine ? 'self-end items-end' : 'self-start items-start'}`}>
                  <div className={`px-5 py-3 rounded-2xl text-[15px] leading-relaxed shadow-sm w-fit ${
                    isMine 
                    ? 'bg-indigo-600 text-white rounded-br-sm' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider mx-1">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* --- MESSAGE INPUT BAR --- */}
        <div className="p-4 bg-white border-t border-slate-100 shrink-0">
          <form onSubmit={handleSendMessage} className="flex gap-2 relative">
            <input 
              type="text" 
              placeholder="Type your message..." 
              className="flex-1 pl-6 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-full focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-slate-900 font-medium transition-all"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              required
            />
            <button 
              type="submit" 
              disabled={!newMessage.trim()}
              className="absolute right-2 top-2 bottom-2 w-10 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:hover:bg-indigo-600 shadow-sm"
            >
              ↑
            </button>
          </form>
        </div>

      </div>
    </main>
  );
}