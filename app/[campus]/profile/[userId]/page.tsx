"use client";

import { useEffect, useState, use } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';

export default function PublicProfile({
  params,
}: {
  params: Promise<{ campus: string; userId: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { campus, userId } = resolvedParams;

  const [profile, setProfile] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      // 1. Get the seller's profile details
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // 2. Get all active listings for this specific user
      const { data: itemData } = await supabase
        .from('items')
        .select('*')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });

      if (profileData) setProfile(profileData);
      if (itemData) setItems(itemData);
      setLoading(false);
    };

    fetchProfileData();
  }, [userId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center pt-32 text-slate-400">Loading Profile...</div>;
  if (!profile) return <div className="min-h-screen flex items-center justify-center pt-32 text-slate-400">User not found.</div>;

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-24 bg-slate-50 pt-32">
      <div className="w-full max-w-5xl">
        
        {/* Profile Identity Card */}
        <div className="bg-white rounded-3xl p-8 md:p-12 mb-12 shadow-sm border border-slate-200 flex flex-col md:flex-row gap-8 items-center md:items-start">
          <div className="w-24 h-24 md:w-32 md:h-32 bg-indigo-600 rounded-full flex items-center justify-center text-4xl font-black text-white shadow-xl shadow-indigo-100">
            {profile.full_name?.charAt(0).toUpperCase()}
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
               <h1 className="text-3xl font-black text-slate-900">{profile.full_name}</h1>
               <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full w-fit mx-auto md:mx-0">
                 Verified {campus.toUpperCase()} Student
               </span>
            </div>
            
            <div className="flex justify-center md:justify-start items-center gap-6 mb-6">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-slate-900 flex items-center gap-1">
                  <span className="text-amber-400">★</span> {profile.average_rating}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Reliability Rating</span>
              </div>
              <div className="w-[1px] h-8 bg-slate-200"></div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-slate-900">{profile.total_reviews}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Reviews</span>
              </div>
              <div className="w-[1px] h-8 bg-slate-200"></div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-slate-900">{items.length}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Active Listings</span>
              </div>
            </div>

            <button 
              onClick={() => router.back()}
              className="text-slate-500 font-bold text-sm hover:text-slate-800 transition-colors"
            >
              ← Back to Marketplace
            </button>
          </div>
        </div>

        {/* Listings Grid */}
        <h2 className="text-xl font-bold text-slate-800 mb-8 ml-2">Active Listings by {profile.full_name}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
              <div className="w-full h-40 bg-slate-50 rounded-xl mb-4 overflow-hidden">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold">{item.category}</div>
                )}
              </div>
              <h3 className="font-bold text-slate-900 mb-1">{item.title}</h3>
              <p className="text-indigo-600 font-black text-sm mb-4">₹{item.price}</p>
              <button 
                onClick={() => router.push(`/${campus}/messages`)} // Simple redirect to messages
                className="w-full py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors"
              >
                Inquire
              </button>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}