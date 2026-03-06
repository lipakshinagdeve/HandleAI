'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      router.replace('/dashboard');
    } else {
      setCheckingAuth(false);
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Login successful! Redirecting...');
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.session) {
          localStorage.setItem('supabase_session', JSON.stringify(data.session));
        }
        window.dispatchEvent(new CustomEvent('auth-change'));
        setTimeout(() => router.push('/dashboard'), 1000);
      } else {
        if (data.emailNotConfirmed) {
          setMessage(
            'Please check your email and click the confirmation link before logging in.'
          );
        } else {
          setMessage(data.message || 'Login failed');
        }
      }
    } catch {
      setMessage('Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      {/* Minimal header */}
      <header className="px-6 py-4">
        <Link
          href="/"
          className="text-lg font-semibold text-zinc-900 tracking-tight"
        >
          Handle
        </Link>
      </header>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Sign in to your account to continue.
            </p>
          </div>

          {message && (
            <div
              className={`mb-6 px-4 py-3 rounded-xl text-sm ${
                message.includes('successful')
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-600 border border-red-200'
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-700 mb-1.5"
              >
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus-ring"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-700 mb-1.5"
              >
                Password
              </label>
              <input
                type="password"
                name="password"
                id="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus-ring"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="font-medium text-accent hover:text-accent-hover transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
