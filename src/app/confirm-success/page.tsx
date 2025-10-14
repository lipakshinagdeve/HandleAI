'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

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
      // Store complete user data with the firstName from the backend
      const userData = {
        id: userId,
        email: email,
        user_metadata: {
          first_name: firstName || 'User',
          last_name: '',
          phone_number: ''
        }
      };

      localStorage.setItem('user', JSON.stringify(userData));
      
      setMessage('Email confirmed successfully! Redirecting to dashboard...');
      
      // Clean URL by replacing current history entry (remove query params)
      window.history.replaceState({}, '', '/confirm-success');
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } else {
      setMessage('Invalid confirmation link.');
      setLoading(false);
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #ffb6c1 0%, #ffffff 100%)' }}>
      {/* Header */}
      <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold" style={{ color: '#ffa3d1' }}>
                Handle
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4" style={{ background: 'linear-gradient(135deg, #ffa3d1 0%, #eeaace 100%)' }}>
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-4">Email Confirmed!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            
            {loading && (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#ffa3d1' }}></div>
              </div>
            )}
            
            {!loading && (
              <div className="space-y-4">
                <Link 
                  href="/dashboard"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #ffa3d1 0%, #eeaace 100%)' }}
                >
                  Go to Dashboard
                </Link>
                <Link 
                  href="/login"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ConfirmSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ffb6c1 0%, #ffffff 100%)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{ borderColor: '#ffa3d1' }}></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ConfirmSuccessContent />
    </Suspense>
  );
}
