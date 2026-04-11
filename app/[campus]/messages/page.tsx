"use client";

import { useEffect, useState, use } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';

export default function InboxPage({
  params,
}: {
  params: Promise<{ campus: string }>;
}) {
  const resolvedParams = use(params);
  const campusCode = resolvedParams.campus;
  const router = useRouter();

  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchInbox = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      
      setCurrentUserId(session.user.id);

      // Safe fetch: Grab the chats and the item details
      const { data: chatData, error } = await supabase
        .from('chats')
        .select(`
          id, 
          created_at,
          buyer_id,
          seller_id,
          items (title, image_url, category)
        `)
        .or(`buyer_id.eq.${session.user.id},seller_id.eq.${session.user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Database Error fetching inbox:", error);
      }

      if (chatData) setChats(chatData);
      setLoading(false);
    };

    fetchInbox();
  }, [router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center pt-32 text-slate-500 font-medium">Loading Inbox...</div>;

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-24 bg-slate-50 pt-32 w-full">
      <div className="w-full max-w-4xl">
        
        <div className="flex justify-between items-end mb-8 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">My Inbox</h1>
            <p className="text-slate-500">Manage your active conversations.</p>
          </div>
          <button onClick={() => router.push(`/${campusCode}`)} className="text-sm font-bold text-indigo-600 hover:text-indigo-800">
            Back to Hub
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {chats.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center">
              <p className="text-slate-500 font-medium">Your inbox is empty.</p>
            </div>
          ) : (
            chats.map((chat) => {
              const isSeller = currentUserId === chat.seller_id;
              const roleTag = isSeller ? "SELLING" : "BUYING";

              return (
                <div 
                  key={chat.id} 
                  onClick={() => router.push(`/${campusCode}/messages/${chat.id}`)}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex items-center gap-6 group"
                >
                  {/* --- BULLETPROOF THUMBNAIL --- */}
                  <div className="relative w-16 h-16 min-w-[64px] max-w-[64px] min-h-[64px] max-h-[64px] rounded-xl bg-slate-100 overflow-hidden shrink-0 hidden md:block">
                    {chat.items?.image_url ? (
                      <img 
                        src={chat.items.image_url} 
                        alt="Item" 
                        className="absolute inset-0 w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400 font-bold p-2 text-center leading-tight">
                        {chat.items?.category}
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">
                        {chat.items?.title || "Item Chat"}
                      </h3>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${isSeller ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                        {roleTag}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 font-medium">Click to view conversation</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </main>
  );
}