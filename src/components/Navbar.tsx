'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [mounted]);

  // Re-check auth when storage changes (other tabs) or auth-change event (same tab)
  useEffect(() => {
    if (!mounted) return;
    const updateUser = () => {
      const userData = localStorage.getItem('user');
      try {
        setUser(userData ? JSON.parse(userData) : null);
      } catch {
        setUser(null);
      }
    };
    window.addEventListener('storage', updateUser);
    window.addEventListener('auth-change', updateUser);
    return () => {
      window.removeEventListener('storage', updateUser);
      window.removeEventListener('auth-change', updateUser);
    };
  }, [mounted]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('supabase_session');
    setUser(null);
    window.dispatchEvent(new CustomEvent('auth-change'));
    router.push('/');
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl border-b border-zinc-200 shadow-soft'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-6xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <Link
            href="/"
            className="text-lg font-semibold text-zinc-900 tracking-tight"
          >
            Handle
          </Link>
          <div className="flex items-center gap-2">
            {mounted && user ? (
              <>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors rounded-lg"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors rounded-lg"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
