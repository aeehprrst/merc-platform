"use client";

import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

export default function CampusMarketplace({
  params,
}: {
  params: Promise<{ campus: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const campusCode = resolvedParams.campus;
  const searchDomain = `${campusCode.toLowerCase()}.ac.in`;

  const [university, setUniversity] = useState<any>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- NEW: SEARCH & FILTER STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', 'Academic Books', 'Electronics', 'Stationery & Tools', 'Hostel Utilities'];

  useEffect(() => {
    const fetchMarketplaceData = async () => {
      const { data: uniData, error: uniError } = await supabase
        .from('universities')
        .select('id, name')
        .eq('domain', searchDomain)
        .single();

      if (uniError || !uniData) {
        router.push('/login');
        return;
      }
      setUniversity(uniData);

      const { data: items } = await supabase
        .from('items')
        .select('*, profiles:seller_id(full_name, average_rating, total_reviews)')
        .eq('university_id', uniData.id)
        .order('created_at', { ascending: false });

      if (items) {
        setSales(items.filter(item => item.listing_type === 'SALE' || !item.listing_type));
        setRequests(items.filter(item => item.listing_type === 'REQUEST'));
      }
      setLoading(false);
    };

    fetchMarketplaceData();
  }, [searchDomain, router]);

  // --- NEW: FILTER LOGIC ---
  const filteredSales = sales.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredRequests = requests.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleStartChat = async (itemId: string, sellerId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      alert("Please log in to send a message.");
      router.push('/login');
      return;
    }

    const buyerId = session.user.id;
    if (buyerId === sellerId) {
      alert("You cannot message yourself about your own item!");
      return;
    }

    const { data: profile } = await supabase.from('profiles').select('id').eq('id', buyerId).single();

    if (!profile) {
      await supabase.from('profiles').insert([
        { 
          id: buyerId, 
          email: session.user.email, 
          full_name: session.user.email?.split('@')[0] 
        }
      ]);
    }

    const { data: existingChats } = await supabase
      .from('chats')
      .select('id')
      .eq('item_id', itemId)
      .eq('buyer_id', buyerId)
      .eq('seller_id', sellerId);

    let chatId;
    if (existingChats && existingChats.length > 0) {
      chatId = existingChats[0].id;
    } else {
      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert([{ item_id: itemId, buyer_id: buyerId, seller_id: sellerId }])
        .select()
        .single();

      if (chatError) return;
      chatId = newChat.id;
    }

    router.push(`/${campusCode.toLowerCase()}/messages/${chatId}`);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center pt-32 text-slate-500 font-medium">Loading {campusCode.toUpperCase()} Marketplace...</div>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-24 bg-slate-50 pt-32">
      <div className="w-full max-w-6xl">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 mb-2">{university?.name} Hub</h1>
            <p className="text-lg text-slate-600">Exclusive trading zone verified for {searchDomain} students.</p>
          </div>
          <div className="flex gap-3">
            <a href={`/${campusCode.toLowerCase()}/dashboard`} className="bg-white border border-slate-300 text-slate-700 font-semibold px-6 py-3 rounded-full hover:bg-slate-50 transition-all shadow-sm whitespace-nowrap">My Dashboard</a>
            <a href={`/${campusCode.toLowerCase()}/sell`} className="bg-slate-900 text-white font-semibold px-6 py-3 rounded-full shadow-md hover:bg-slate-800 transition-all hover:shadow-lg flex items-center gap-2 whitespace-nowrap">+ Create Post</a>
          </div>
        </div>

        {/* --- NEW: SEARCH & FILTER UI --- */}
        {/* --- PROFESSIONAL SEARCH & FILTER UI --- */}
        <div className="flex flex-col gap-8 mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
          
          <div className="relative w-full max-w-2xl group">
            {/* Professional SVG Search Icon */}
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <svg 
                className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <input 
              type="text"
              placeholder="Search for books, electronics, hostel gear..."
              className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-3xl shadow-sm focus:shadow-md focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-900 font-medium transition-all placeholder:text-slate-400 placeholder:font-normal"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Browse Categories</span>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all border-2 ${
                    activeCategory === cat 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200 -translate-y-0.5' 
                    : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300 hover:text-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 1: Items For Sale */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            Available for Sale
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSales.length > 0 ? (
              filteredSales.map((item) => (
                <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all group flex flex-col">
                  <div className="w-full h-48 bg-slate-100 rounded-xl mb-4 overflow-hidden relative group-hover:opacity-90 transition-opacity">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">{item.category}</div>
                    )}
                  </div>
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h3 className="text-lg font-bold text-slate-900 leading-tight">{item.title}</h3>
                    <div className="flex flex-col items-end gap-1">
                      <span className="bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-full text-sm whitespace-nowrap">Buy ₹{item.price}</span>
                      {item.is_rentable && (
                        <span className="bg-amber-50 text-amber-700 font-bold px-3 py-1 rounded-full text-xs whitespace-nowrap border border-amber-200">Rent ₹{item.rental_price_per_day}/day</span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-grow">{item.description}</p>
                  
                  {/* Trust Badge */}
                  {/* Trust Badge - Now Clickable! */}
<div 
  onClick={() => router.push(`/${campusCode.toLowerCase()}/profile/${item.seller_id}`)}
  className="flex items-center gap-1 mb-4 text-sm text-slate-600 font-medium border-t border-slate-100 pt-4 cursor-pointer hover:bg-slate-50 rounded-xl transition-colors p-1"
>
  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold mr-1">
    {item.profiles?.full_name ? item.profiles.full_name.charAt(0).toUpperCase() : 'S'}
  </div>
  <span className="text-slate-800 font-bold group-hover:text-indigo-600 transition-colors">
    {item.profiles?.full_name || 'Verified Student'}
  </span>
  <span className="mx-1 text-slate-300">•</span>
  <span className="text-amber-400 text-lg leading-none">★</span>
  <span className="text-slate-700">{item.profiles?.average_rating || '5.0'}</span>
  <span className="text-slate-400 text-xs">({item.profiles?.total_reviews || 0})</span>
</div>

                  <button 
                    onClick={() => handleStartChat(item.id, item.seller_id)}
                    className="w-full py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors mt-auto"
                  >
                    Contact Seller
                  </button>
                </div>
              ))
            ) : (
              <p className="text-slate-500 font-medium bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center col-span-full">
                {searchQuery || activeCategory !== 'All' ? "No items match your search." : "No items for sale yet."}
              </p>
            )}
          </div>
        </div>

        {/* SECTION 2: Community Requests (WTB) */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></span>
            Community Requests (WTB)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredRequests.length > 0 ? (
              filteredRequests.map((item) => (
                <div key={item.id} className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 hover:shadow-md transition-all relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">REQUEST</div>
                  <div className="flex justify-between items-start mb-2 mt-2">
                    <h3 className="text-lg font-bold text-indigo-950">{item.title}</h3>
                    <span className="text-indigo-700 font-bold text-sm bg-white px-3 py-1 rounded-full shadow-sm">Budget: ₹{item.price}</span>
                  </div>
                  <p className="text-sm text-indigo-800/80 line-clamp-2 mb-4">{item.description}</p>
                  <button onClick={() => handleStartChat(item.id, item.seller_id)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                    I have this item →
                  </button>
                </div>
              ))
            ) : (
              <p className="text-slate-500 font-medium bg-slate-50 p-8 rounded-2xl border border-dashed border-slate-300 text-center col-span-full">
                {searchQuery || activeCategory !== 'All' ? "No requests match your search." : "No active requests."}
              </p>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}