import Link from 'next/link';

export default function Navbar() {
  return (
    // Fixed position, blurry glass background, subtle border
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-md border-b border-slate-200/50 transition-all">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
        
        {/* Brand Logo with gradient text */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:shadow-lg transition-all">
            M
          </div>
          <span className="text-xl font-extrabold text-slate-900 tracking-tighter">
            M.E.R.C.
          </span>
        </Link>

        {/* Navigation Links & Actions */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
            Platform Features
          </Link>
          <Link href="#institutions" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
            Partner Institutions
          </Link>
          <div className="h-4 w-px bg-slate-300"></div> {/* Divider */}
          <button className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
            Admin Portal
          </button>
          <button className="text-sm font-semibold bg-slate-900 text-white px-5 py-2.5 rounded-full hover:bg-slate-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
            Student Portal
          </button>
        </div>
      </div>
    </nav>
  );
}