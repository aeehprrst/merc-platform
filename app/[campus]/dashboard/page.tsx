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

      // Fetch ONLY the items posted by this specific user
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
    // Confirm before deleting to prevent accidental clicks
    if (!window.confirm("Are you sure you want to delete this listing? It cannot be undone.")) return;

    // Delete from Supabase
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId);

    if (error) {
      alert("Error deleting item.");
      console.error(error);
    } else {
      // Instantly remove it from the screen without refreshing the page
      setMyItems((current) => current.filter((item) => item.id !== itemId));
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center pt-32 font-medium text-slate-500">Loading your inventory...</div>;

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-24 bg-slate-50 pt-32">
      <div className="w-full max-w-5xl">
        
        {/* Dashboard Header */}
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
              <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${item.listing_type === 'REQUEST' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {item.listing_type === 'REQUEST' ? 'WTB REQUEST' : 'SELLING'}
                  </span>
                  <span className="font-bold text-slate-700">₹{item.price}</span>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-6 flex-grow">{item.description}</p>
                
                {/* Delete Button */}
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors mt-auto border border-red-100"
                >
                  Delete Listing
                </button>
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