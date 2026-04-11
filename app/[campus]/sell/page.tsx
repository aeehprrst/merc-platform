"use client";

import { useState, use } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';

export default function SellPage({
  params,
}: {
  params: Promise<{ campus: string }>;
}) {
  const resolvedParams = use(params);
  const campusCode = resolvedParams.campus.toUpperCase();
  const router = useRouter();

  const [listingType, setListingType] = useState<'SALE' | 'REQUEST'>('SALE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Academic Books');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Renting State
  const [isRentable, setIsRentable] = useState(false);
  const [rentalPrice, setRentalPrice] = useState('');

  const handleListSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert("You must be logged in to post.");
      router.push('/login');
      return;
    }

    const searchDomain = `${campusCode.toLowerCase()}.ac.in`;
    const { data: university } = await supabase.from('universities').select('id').eq('domain', searchDomain).single();

    if (!university) {
      alert("University not found.");
      setLoading(false);
      return;
    }

    let imageUrl = null;
    
    // 1. Upload Image to Supabase (if provided)
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('item-images').upload(filePath, imageFile);

      if (uploadError) {
        alert("Error uploading image.");
        setLoading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage.from('item-images').getPublicUrl(filePath);
      imageUrl = publicUrlData.publicUrl;
    }

    // --- 🚨 THE AI BOUNCER CHECK 🚨 ---
    // Only run if it's a sale and they uploaded an image for the AI to check
    if (listingType === 'SALE' && imageUrl) {
      alert("Hold on! Our AI is reviewing your listing for campus safety...");

      try {
        const aiResponse = await fetch('/api/moderate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title: title, 
            description: description, 
            imageUrl: imageUrl 
          })
        });
        
        const aiData = await aiResponse.json();

        if (aiData.verdict === 'REJECTED') {
          // Now showing the actual reason from Gemini!
          alert(`🛑 POST REJECTED: ${aiData.reason || "Safety violation detected."}`);
          setLoading(false);
          return; 
        }
      } catch (err) {
        console.error("AI Moderation failed:", err);
        alert("Error connecting to AI Moderation. Please try again.");
        setLoading(false);
        return;
      }
    }
    // ----------------------------------------

    // 2. Insert into Database (Because AI Approved it!)
    const { error } = await supabase.from('items').insert([
      {
        title,
        description,
        price: parseFloat(price),
        category,
        university_id: university.id,
        seller_id: session.user.id,
        listing_type: listingType,
        image_url: imageUrl,
        is_rentable: listingType === 'SALE' ? isRentable : false,
        rental_price_per_day: isRentable && listingType === 'SALE' ? parseFloat(rentalPrice) : 0,
        status: 'APPROVED' // <-- Set to Approved so it shows up on the Hub!
      }
    ]);

    if (error) {
      console.error(error);
      alert("Error posting.");
    } else {
      router.push(`/${campusCode.toLowerCase()}`);
    }
    setLoading(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-50 pt-32 px-6 pb-12">
      <div className="w-full max-w-2xl bg-white p-10 rounded-3xl border border-slate-200 shadow-sm">
        
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-10 relative">
          <button type="button" onClick={() => setListingType('SALE')} className={`flex-1 py-3 text-sm font-bold rounded-xl z-10 transition-all duration-300 ${listingType === 'SALE' ? 'text-slate-900 shadow-sm bg-white' : 'text-slate-500 hover:text-slate-700'}`}>Sell an Item</button>
          <button type="button" onClick={() => setListingType('REQUEST')} className={`flex-1 py-3 text-sm font-bold rounded-xl z-10 transition-all duration-300 ${listingType === 'REQUEST' ? 'text-indigo-700 shadow-sm bg-white' : 'text-slate-500 hover:text-slate-700'}`}>Request an Item (WTB)</button>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{listingType === 'SALE' ? 'List an Item for Sale' : 'Post a Request'}</h1>
        <p className="text-slate-500 mb-8">{listingType === 'SALE' ? `Add a resource to the secure ${campusCode} marketplace.` : `Tell the ${campusCode} community what you are looking for.`}</p>

        <form onSubmit={handleListSubmit} className="flex flex-col gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">{listingType === 'SALE' ? 'Item Title' : 'What do you need?'}</label>
            <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 outline-none text-slate-900 font-medium" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{listingType === 'SALE' ? 'Outright Price (₹)' : 'Willing to pay up to (₹)'}</label>
              <input type="number" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 outline-none text-slate-900 font-medium" value={price} onChange={(e) => setPrice(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
              <select 
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 outline-none bg-white text-slate-900 font-medium" 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
              >
                <option>Academic Books</option>
                <option>Electronics</option>
                <option>Stationery & Tools</option>
                <option>Hostel Utilities</option>
              </select>
            </div>
          </div>

          {/* Renting Options Section */}
          {listingType === 'SALE' && (
            <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 mt-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-800">Available for Rent?</h3>
                  <p className="text-xs text-slate-500">Allow students to rent this item per day.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={isRentable} onChange={() => setIsRentable(!isRentable)} />
                  <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {isRentable && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Rental Price per Day (₹)</label>
                  <input type="number" placeholder="e.g., 50" className="w-full px-4 py-3 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-600 outline-none text-slate-900 font-medium" value={rentalPrice} onChange={(e) => setRentalPrice(e.target.value)} required={isRentable} />
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
            <textarea 
              rows={4} 
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 outline-none resize-none text-slate-900 font-medium" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              required 
            ></textarea>
          </div>

          {listingType === 'SALE' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Upload Photo</label>
              <input type="file" accept="image/*" onChange={(e) => { if (e.target.files && e.target.files.length > 0) { setImageFile(e.target.files[0]); } }} className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
            </div>
          )}

          <button type="submit" disabled={loading} className={`w-full text-white font-bold py-4 rounded-xl mt-4 disabled:opacity-50 ${listingType === 'SALE' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
            {loading ? "Processing..." : (listingType === 'SALE' ? "Post to Marketplace" : "Broadcast Request")}
          </button>
        </form>
      </div>
    </main>
  );
}