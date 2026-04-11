import Link from "next/link";

export default function Home() {
  return (
    // Added padding top (pt-32) so the fixed navbar doesn't cover the content
    <main className="flex min-h-screen flex-col bg-slate-50 pt-32 px-6">
      
      {/* Hero Section */}
      <section className="max-w-5xl mx-auto w-full flex flex-col items-center text-center mt-12 mb-24 relative z-10">
        
        {/* Modern "Badge" above the headline */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 mb-8">
          <span className="flex h-2 w-2 rounded-full bg-indigo-600"></span>
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
            Next-Gen Campus Infrastructure
          </span>
        </div>

        {/* Powerful Headline */}
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
          The central nervous system for <br className="hidden md:block"/> 
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
            student commerce.
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="text-lg md:text-xl font-medium text-slate-500 mb-10 max-w-2xl leading-relaxed">
          M.E.R.C. deploys isolated, secure, and domain-verified peer-to-peer marketplaces tailored instantly for any university.
        </p>

        {/* Primary Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <Link
            href="/vit"
            className="px-8 py-4 bg-slate-900 text-white font-semibold rounded-full hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            Access VIT Demo Marketplace
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
          <button className="px-8 py-4 bg-white text-slate-700 font-semibold rounded-full hover:bg-slate-50 transition-all border border-slate-200 shadow-sm w-full sm:w-auto">
            University Registration
          </button>
        </div>
      </section>

      {/* Bento Box Feature Grid (Looks highly professional) */}
      <section className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6 pb-24">
        
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">Domain Isolation</h3>
          <p className="text-slate-500 font-medium">Data is strictly siloed. Students can only view and interact with inventory verified within their university's network.</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all md:col-span-2 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-violet-100 rounded-full blur-3xl -z-10 group-hover:bg-violet-200 transition-colors"></div>
           <h3 className="text-2xl font-bold text-slate-900 mb-3">Multi-Tenant Architecture</h3>
           <p className="text-slate-500 font-medium max-w-md">One powerful engine driving thousands of private marketplaces. Scale instantly from VIT Vellore to every college in India without rewriting code.</p>
        </div>

      </section>
    </main>
  );
}