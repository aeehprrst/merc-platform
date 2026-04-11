"use client";

import { useEffect, useState, use } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';

export default function UserDashboard({
  params,
}: {
  params: Promise<{ campus: string }>;
}) {
  const resolvedParams = use(params);
  const campusCode = resolvedParams.campus;
  const router = useRouter();

  const [myItems, setMyItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const fetchMyInventory = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }
      
      setUserEmail(session.user.email || '');

      const { data: items } = await supabase
        .from('items')
        .select('*')
        .eq('seller_id', session.user.id)
        .order('created_at', { ascending: false });

      if (items) setMyItems(items);
      setLoading(false);
    };

    fetchMyInventory();
  }, [router]);

  const handleDelete = async (itemId: string) => {
    if (!window.confirm("Are you sure you want to delete this listing? It cannot be undone.")) return;

    const { error } = await supabase.from('items').delete().eq('id', itemId);

    if (error) {
      alert("Error deleting item.");
      console.error(error);
    } else {
      setMyItems((current) => current.filter((item) => item.id !== itemId));
    }
  };

  // --- NEW: TOGGLE SOLD STATUS ---
  const handleToggleSold = async (itemId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus; // Flips true to false, or false to true
    
    const { error } = await supabase
      .from('items')
      .update({ is_sold: newStatus })
      .eq('id', itemId);

    if (error) {
      alert("Error updating status.");
      console.error(error);
    } else {
      // Instantly update the UI without refreshing
      setMyItems((current) => current.map((item) => 
        item.id === itemId ? { ...item, is_sold: newStatus } : item
      ));
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center pt-32 font-medium text-slate-500">Loading your inventory...</div>;

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-24 bg-slate-50 pt-32">
      <div className="w-full max-w-5xl">
        
        <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-12 mb-12 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-extrabold mb-2">Student Dashboard</h1>
            <p className="text-slate-400">Managing inventory for <span className="font-semibold text-white">{userEmail}</span></p>
          </div>
          <button 
            onClick={() => router.push(`/${campusCode}`)}
            className="bg-white text-slate-900 font-bold px-6 py-3 rounded-full hover:bg-slate-100 transition-all shadow-sm"
          >
            Back to Marketplace
          </button>
        </div>

        <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b border-slate-200 pb-4">My Active Listings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myItems.length > 0 ? (
            myItems.map((item) => (
              <div key={item.id} className={`bg-white p-6 rounded-2xl shadow-sm border ${item.is_sold ? 'border-slate-300 bg-slate-50' : 'border-slate-200'} flex flex-col relative overflow-hidden transition-all`}>
                
                <div className={`flex justify-between items-start mb-4 ${item.is_sold ? 'opacity-50' : ''}`}>
                  <div className="flex flex-col items-start gap-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${item.listing_type === 'REQUEST' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {item.listing_type === 'REQUEST' ? 'WTB REQUEST' : 'SELLING'}
                    </span>
                    {item.is_sold && (
                      <span className="bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                        Sold / Closed
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-slate-700">₹{item.price}</span>
                </div>
                
                <h3 className={`text-lg font-bold text-slate-900 mb-2 ${item.is_sold ? 'opacity-50 line-through' : ''}`}>{item.title}</h3>
                <p className={`text-sm text-slate-500 line-clamp-2 mb-6 flex-grow ${item.is_sold ? 'opacity-50' : ''}`}>{item.description}</p>
                
                {/* --- ACTION BUTTONS --- */}
                <div className="flex gap-2 mt-auto">
                  <button 
                    onClick={() => handleToggleSold(item.id, item.is_sold)}
                    className={`flex-1 py-3 text-sm font-bold rounded-xl transition-colors border ${
                      item.is_sold 
                      ? 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100' 
                      : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                    }`}
                  >
                    {item.is_sold ? "Re-list Item" : "Mark as Sold"}
                  </button>

                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="flex-1 py-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 transition-colors border border-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center">
              <p className="text-slate-500 font-medium mb-4">You have no active listings or requests.</p>
              <button 
                onClick={() => router.push(`/${campusCode}/sell`)}
                className="text-indigo-600 font-bold hover:text-indigo-800"
              >
                + Create your first post
              </button>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}