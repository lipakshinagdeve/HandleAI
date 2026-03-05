'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

function ConfirmSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Confirming your email...');

  useEffect(() => {
    const email = searchParams.get('email');
    const userId = searchParams.get('userId');
    const firstName = searchParams.get('firstName');

    if (email && userId) {
      const userData = {
        id: userId,
        email: email,
        user_metadata: {
          first_name: firstName || 'User',
          last_name: '',
          phone_number: '',
        },
      };

      localStorage.setItem('user', JSON.stringify(userData));
      setMessage('Email confirmed! Redirecting to dashboard...');
      window.history.replaceState({}, '', '/confirm-success');

      setTimeout(() => router.push('/dashboard'), 1500);
    } else {
      setMessage('Invalid confirmation link.');
      setLoading(false);
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      <header className="px-6 py-4">
        <Link
          href="/"
          className="text-lg font-semibold text-zinc-900 tracking-tight"
        >
          Handle
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-sm text-center animate-fade-in">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 mx-auto mb-6">
            <CheckCircle className="w-7 h-7" />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 mb-2">
            Email Confirmed
          </h1>
          <p className="text-sm text-zinc-500 mb-8">{message}</p>

          {loading && (
            <div className="flex justify-center">
              <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
            </div>
          )}

          {!loading && (
            <div className="space-y-3">
              <Link
                href="/dashboard"
                className="block w-full px-4 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-colors text-center"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/login"
                className="block w-full px-4 py-2.5 bg-white border border-zinc-200 text-zinc-700 text-sm font-medium rounded-xl hover:bg-zinc-50 transition-colors text-center"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ConfirmSuccess() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
          <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
        </div>
      }
    >
      <ConfirmSuccessContent />
    </Suspense>
  );
}
