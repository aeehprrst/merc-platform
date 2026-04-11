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
        .eq('status', 'APPROVED')
        .order('created_at', { ascending: false });

      if (items) {
        setSales(items.filter(item => item.listing_type === 'SALE' || !item.listing_type));
        setRequests(items.filter(item => item.listing_type === 'REQUEST'));
      }
      setLoading(false);
    };

    fetchMarketplaceData();
  }, [searchDomain, router]);

  // --- THE CHAT BRIDGE FUNCTION ---
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

    // 1. Check if a chat already exists
    const { data: existingChats } = await supabase
      .from('chats')
      .select('id')
      .eq('item_id', itemId)
      .eq('buyer_id', buyerId)
      .eq('seller_id', sellerId);

    let chatId;

    if (existingChats && existingChats.length > 0) {
      // Chat exists! Grab the ID.
      chatId = existingChats[0].id;
    } else {
      // 2. No chat found. Create a new one!
      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert([{ 
          item_id: itemId, 
          buyer_id: buyerId, 
          seller_id: sellerId 
        }])
        .select()
        .single();

      if (chatError) {
        alert("Could not start chat. Please try again.");
        return;
      }
      chatId = newChat.id;
    }

    // 3. Send the user to their sleek new chat window
    router.push(`/${campusCode.toLowerCase()}/messages/${chatId}`);
  };
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
                <div key={item.id} className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-200 transition-all group flex flex-col relative ${item.is_sold ? 'opacity-60 bg-slate-50' : 'hover:shadow-md'}`}>
                  
                  <div className="w-full h-48 bg-slate-100 rounded-xl mb-4 overflow-hidden relative group-hover:opacity-90 transition-opacity">
                    {/* NEW: The SOLD Badge over the image */}
                    {item.is_sold && (
                      <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center z-10 backdrop-blur-[2px]">
                        <span className="bg-slate-900 text-white font-black text-sm tracking-widest uppercase px-6 py-2 rounded-full border-2 border-white/20 shadow-xl">
                          Sold Out
                        </span>
                      </div>
                    )}
                    
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">{item.category}</div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-start mb-2 gap-2">
                    {/* We add line-through to the title if sold */}
                    <h3 className={`text-lg font-bold text-slate-900 leading-tight ${item.is_sold ? 'line-through decoration-slate-400' : ''}`}>
                      {item.title}
                    </h3>
                    <div className="flex flex-col items-end gap-1">
                      <span className="bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-full text-sm whitespace-nowrap">Buy ₹{item.price}</span>
                      {item.is_rentable && !item.is_sold && (
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

                  {/* The Chat Button */}
                  {item.is_sold ? (
                    <button disabled className="w-full py-3 bg-slate-100 text-slate-400 font-bold tracking-widest uppercase text-xs rounded-xl mt-auto cursor-not-allowed">
                      Item Sold
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleStartChat(item.id, item.seller_id)}
                      className="w-full py-3 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-600 hover:text-white transition-colors mt-auto shadow-sm"
                    >
                      Contact Seller
                    </button>
                  )}
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
                  {/* The Chat Button (Disabled if Closed) */}
                  {item.is_sold ? (
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                      Request Closed
                    </span>
                  ) : (
                    <button 
                      onClick={() => handleStartChat(item.id, item.seller_id)}
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      I have this item →
                    </button>
                  )}
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
      {/* --- CORRECTED FLOATING INBOX --- */}
      <div className="fixed bottom-6 right-6 z-[9999]">
        <button 
          onClick={() => router.push(`/${campusCode.toLowerCase()}/messages`)}
          className="flex items-center gap-3 bg-white text-slate-900 px-5 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 hover:border-indigo-500 hover:shadow-indigo-200/50 transition-all duration-300 group"
        >
          <div className="relative">
            <svg className="w-6 h-6 text-slate-700 group-hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-600 rounded-full border-2 border-white"></span>
          </div>
          <span className="font-bold text-sm tracking-tight">Messages</span>
        </button>
      </div>
    </main>
  );
}