'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  user_metadata: {
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    background_info?: string;
  };
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobUrl, setJobUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [generatedResponses, setGeneratedResponses] = useState<Record<string, string> | null>(null);
  const [showResponses, setShowResponses] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      router.push('/login');
    }
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleJobApplication = async () => {
    if (!jobUrl.trim()) {
      setMessage('Please enter a job application URL');
      return;
    }

    if (!user) {
      setMessage('User not found. Please log in again.');
      return;
    }

    // Check if user has background info
    if (!user.user_metadata?.background_info) {
      setMessage('Please complete your background information in Settings first');
      return;
    }

    setIsProcessing(true);
    setMessage('');

    try {
      const userBackground = {
        firstName: user.user_metadata?.first_name || '',
        lastName: user.user_metadata?.last_name || '',
        email: user.email,
        phoneNumber: user.user_metadata?.phone_number || '',
        backgroundInfo: user.user_metadata?.background_info || ''
      };

      const response = await fetch('/api/jobs/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobUrl: jobUrl.trim(),
          userBackground
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ Success! Browser automation started for ${data.data.jobTitle} at ${data.data.companyName}. Check the new browser window to see the form being filled automatically!`);
        setApplicationsCount(prev => prev + 1);
        setJobUrl(''); // Clear the input
      } else {
        setMessage(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Job application error:', error);
      setMessage('❌ Failed to process job application. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ffb6c1 0%, #ffffff 100%)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{ borderColor: '#ffa3d1' }}></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #ffb6c1 0%, #ffffff 100%)' }}>
      {/* Header */}
      <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold" style={{ color: '#ffa3d1' }}>
                Handle
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/settings"
                className="text-gray-600 hover:opacity-80 py-2 rounded-md text-sm font-medium"
              >
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #ffa3d1 0%, #eeaace 100%)' }}
              >
                Logout
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to your Dashboard, {user.user_metadata?.first_name || 'User'}!
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your job search and track your applications.
          </p>
        </div>

        {/* AI Job Application Tool */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Job Application Assistant</h2>
          <p className="text-gray-600 mb-6">
            Paste any job application link below. Our AI will open the application in a new browser window and automatically fill out all the form fields with personalized answers based on your profile information. You'll see the browser filling out the form in real-time!
          </p>
          
          <div className="space-y-6">
            {/* Job Link Input */}
            <div>
              <label htmlFor="jobLink" className="block text-sm font-medium text-gray-700 mb-2">
                Job Application Link
              </label>
              <input
                type="url"
                id="jobLink"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="https://company.com/careers/job-application"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400"
                disabled={isProcessing}
              />
            </div>


            {/* Action Button */}
            <div>
              <button
                onClick={handleJobApplication}
                disabled={isProcessing || !jobUrl.trim()}
                className="w-full text-white px-6 py-3 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #ffa3d1 0%, #eeaace 100%)' }}
              >
                {isProcessing ? '🔄 Starting Browser Automation...' : '🤖 Auto-Fill Job Application'}
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Make sure to complete your profile information in <Link href="/settings" className="text-pink-500 hover:underline">Settings</Link> first
              </p>
            </div>

            {/* Status Message */}
            {message && (
              <div className={`p-4 rounded-md ${message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message}
              </div>
            )}
          </div>
        </div>



        {/* Recent Applications */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-semibold text-gray-900">Applications Submitted</h2>
              <span className="text-lg font-medium text-gray-600">({applicationsCount})</span>
            </div>
            <button className="text-sm text-gray-500 hover:text-gray-700">View All</button>
          </div>
          
          <div className="overflow-hidden">
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No applications yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start by pasting a job application link above to get started with AI-powered applications.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

