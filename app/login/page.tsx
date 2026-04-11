"use client";

import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  // Function exactly for LOGGING IN an existing user
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Now it will correctly tell you "Invalid login credentials"
      setMessage(error.message); 
    }  else if (data.session) {
      // Success! Route them to their campus
      const domain = email.split('@')[1];
      
      // We grab the first part of the domain (e.g., 'vit' or 'vitstudent')
      let rawCampusCode = domain.split('.')[0]; 
      
      // If the code ends in "student" (like "vitstudent"), we chop off those last 7 letters
      // so it correctly maps back to the main university domain (e.g., "vit")
      if (rawCampusCode.endsWith('student')) {
         rawCampusCode = rawCampusCode.slice(0, -7);
      }
      
      router.push(`/${rawCampusCode}`);
    }
    setLoading(false);
  };

  // Function exactly for SIGNING UP a new user
  const handleSignUp = async () => {
    setLoading(true);
    setMessage('');
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Account created! Check your email to confirm, then try logging in.");
    }
    setLoading(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Student Portal</h1>
          <p className="text-slate-500 text-sm">Sign in with your verified university email.</p>
        </div>

        {/* Note the form now calls handleSignIn */}
        <form onSubmit={handleSignIn} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">University Email</label>
            <input 
              type="email" 
              placeholder="name@vit.ac.in" 
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all text-slate-900 font-medium"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all text-slate-900 font-medium"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {message && (
            <p className={`text-sm text-center font-medium ${message.includes('Invalid') || message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
              {message}
            </p>
          )}

          <div className="flex flex-col gap-3 mt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 text-white font-semibold py-3 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              {loading ? "Processing..." : "Sign In"}
            </button>
            
            {/* Separate explicit Sign Up button */}
            <button 
              type="button" 
              onClick={handleSignUp}
              disabled={loading}
              className="w-full bg-white text-slate-700 border border-slate-300 font-semibold py-3 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              Create New Account
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}