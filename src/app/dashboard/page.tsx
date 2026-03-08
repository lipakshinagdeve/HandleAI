'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import {
  Send,
  Loader2,
  Link as LinkIcon,
  CheckCircle,
  AlertCircle,
  XCircle,
  Plus,
  ArrowRight,
} from 'lucide-react';

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

interface Application {
  id?: string;
  url: string;
  status: 'pending' | 'processing' | 'applied' | 'failed' | 'saved';
  title?: string;
  company?: string;
}

function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Job';
  }
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobUrls, setJobUrls] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      loadApplications(parsed.id);
    } else {
      router.push('/login');
    }
    setLoading(false);
  }, [router]);

  const loadApplications = async (userId: string) => {
    try {
      const res = await fetch(`/api/applications?userId=${userId}`);
      const data = await res.json();
      if (data.success && data.applications) {
        setApplications(data.applications.map((app: { id: string; job_url: string; status: string; position: string; company: string }) => ({
          id: app.id,
          url: app.job_url,
          status: app.status === 'applied' ? 'applied' : (app.status === 'rejected' || app.status === 'failed') ? 'failed' : app.status === 'saved' ? 'saved' : 'pending',
          title: app.position,
          company: app.company,
        })));
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
    }
  };

  const saveApplication = async (app: { url: string; title: string; company: string; status: string }) => {
    if (!user) return;
    try {
      await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          company: app.company || getDomainFromUrl(app.url),
          position: app.title || 'Job Application',
          jobUrl: app.url,
          status: app.status === 'applied' ? 'applied' : app.status === 'failed' ? 'failed' : 'saved',
        }),
      });
    } catch (err) {
      console.error('Failed to save application:', err);
    }
  };

  const extractJobMetadata = async (url: string): Promise<{ title: string; company: string }> => {
    try {
      const res = await fetch('/api/jobs/extract-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobUrl: url }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        return {
          title: data.data.jobTitle || 'Job Application',
          company: data.data.companyName || getDomainFromUrl(url),
        };
      }
    } catch {
      // ignore
    }
    return { title: 'Job Application', company: getDomainFromUrl(url) };
  };

  const handleSaveForLater = async () => {
    const urls = jobUrls
      .trim()
      .split('\n')
      .filter((url) => url.trim());

    if (urls.length === 0) {
      setMessage('Please enter at least one job URL to save');
      return;
    }

    if (!user) {
      setMessage('User not found. Please log in again.');
      return;
    }

    setMessage('');
    setIsProcessing(true);
    let savedCount = 0;

    for (const url of urls) {
      const trimmedUrl = url.trim();
      const { title, company } = await extractJobMetadata(trimmedUrl);
      try {
        await saveApplication({
          url: trimmedUrl,
          title,
          company,
          status: 'saved',
        });
        savedCount++;
      } catch {
        // continue
      }
    }

    setIsProcessing(false);
    if (savedCount > 0) {
      setMessage(`Saved ${savedCount} job${savedCount > 1 ? 's' : ''} to your tracker.`);
      setJobUrls('');
      loadApplications(user.id);
    }
  };

  const handleApply = async () => {
    const urls = jobUrls
      .trim()
      .split('\n')
      .filter((url) => url.trim());

    if (urls.length === 0) {
      setMessage('Please enter at least one job URL');
      return;
    }

    if (!user) {
      setMessage('User not found. Please log in again.');
      return;
    }

    if (!user.user_metadata?.background_info) {
      setMessage('Please complete your profile information first');
      return;
    }

    setIsProcessing(true);
    setMessage('');

    for (const url of urls) {
      const trimmedUrl = url.trim();
      const domain = getDomainFromUrl(trimmedUrl);

      // Fetch real job title and company from the page before applying
      const metadata = await extractJobMetadata(trimmedUrl);
      setApplications((prev) => [
        ...prev,
        { url: trimmedUrl, status: 'processing', title: metadata.title, company: metadata.company },
      ]);

      try {
        const userBackground = {
          firstName: user.user_metadata?.first_name || '',
          lastName: user.user_metadata?.last_name || '',
          email: user.email,
          phoneNumber: user.user_metadata?.phone_number || '',
          backgroundInfo: user.user_metadata?.background_info || '',
        };

        const response = await fetch('/api/jobs/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobUrl: trimmedUrl, userBackground }),
        });

        let data: {
          success?: boolean;
          message?: string;
          data?: {
            jobTitle?: string;
            companyName?: string;
            isListingPage?: boolean;
            results?: Array<{ jobUrl: string; success: boolean; jobTitle: string; companyName: string }>;
          };
        };
        try {
          data = await response.json();
        } catch {
          setMessage(`Server error for ${domain}. Check that GROQ_API_KEY is set in .env.local and Playwright is installed (npx playwright install chromium).`);
          data = { success: false, data: { jobTitle: metadata.title, companyName: metadata.company } };
        }

        // Handle job listing page (multiple jobs)
        if (data.data?.isListingPage && Array.isArray(data.data.results)) {
          const results = data.data.results;
          setApplications((prev) =>
            prev
              .filter((app) => app.url !== trimmedUrl)
              .concat(
                results.map((r) => ({
                  url: r.jobUrl,
                  status: (r.success ? 'applied' : 'failed') as 'applied' | 'failed',
                  title: r.jobTitle,
                  company: r.companyName,
                }))
              )
          );
          setMessage(data.message || `Processed ${results.length} jobs`);
          for (const r of results) {
            await saveApplication({
              url: r.jobUrl,
              title: r.jobTitle,
              company: r.companyName,
              status: r.success ? 'applied' : 'failed',
            });
          }
        } else {
          // Single job page
          const resultStatus = data.success ? 'applied' : 'failed';
          const title = data.data?.jobTitle || metadata.title || 'Job Application';
          const company = data.data?.companyName || metadata.company || domain;

          setApplications((prev) =>
            prev.map((app) =>
              app.url === trimmedUrl
                ? { ...app, status: resultStatus as 'applied' | 'failed', title, company }
                : app
            )
          );

          if (!data.success && data.message) {
            setMessage(data.message);
          }

          await saveApplication({
            url: trimmedUrl,
            title,
            company,
            status: resultStatus,
          });
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Network or unexpected error';
        setMessage(errMsg);
        setApplications((prev) =>
          prev.map((app) =>
            app.url === trimmedUrl ? { ...app, status: 'failed', title: metadata.title, company: metadata.company } : app
          )
        );

        await saveApplication({
          url: trimmedUrl,
          title: metadata.title,
          company: metadata.company,
          status: 'failed',
        });
      }
    }

    setIsProcessing(false);
    setJobUrls('');
    loadApplications(user.id);
  };

  if (loading || !user) return null;

  const appliedCount = applications.filter(
    (a) => a.status === 'applied'
  ).length;
  const processingCount = applications.filter(
    (a) => a.status === 'processing'
  ).length;
  const failedCount = applications.filter((a) => a.status === 'failed').length;

  return (
    <AppShell>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Welcome back
            {user.user_metadata?.first_name
              ? `, ${user.user_metadata.first_name}`
              : ''}
          </h1>
          <p className="mt-1 text-zinc-500 text-sm">
            Paste job links and let AI handle the applications.
          </p>
        </div>

        {/* Quick stats */}
        {applications.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-zinc-200 p-4">
              <p className="text-2xl font-semibold text-zinc-900">
                {appliedCount}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Applied</p>
            </div>
            <div className="bg-white rounded-2xl border border-zinc-200 p-4">
              <p className="text-2xl font-semibold text-zinc-900">
                {processingCount}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Processing</p>
            </div>
            <div className="bg-white rounded-2xl border border-zinc-200 p-4">
              <p className="text-2xl font-semibold text-zinc-900">
                {failedCount}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Failed</p>
            </div>
          </div>
        )}

        {/* Job Links Input */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-soft mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-light text-accent">
              <LinkIcon className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-zinc-900">Apply to Jobs</h2>
          </div>

          <textarea
            value={jobUrls}
            onChange={(e) => setJobUrls(e.target.value)}
            placeholder={`Paste job application URLs here, one per line...\nhttps://company.com/careers/job-1\nhttps://another.com/apply/role-2`}
            rows={5}
            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus-ring resize-none font-mono"
            disabled={isProcessing}
          />

          {message && (
            <div className="mt-3 flex items-start gap-2 text-sm text-amber-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                {message}
                {message.includes('profile') && (
                  <>
                    {' '}
                    <Link
                      href="/profile"
                      className="underline text-accent hover:text-accent-hover"
                    >
                      Go to Profile
                    </Link>
                  </>
                )}
              </span>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-zinc-400">
              One URL per line. Save for later or apply with AI.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveForLater}
                disabled={isProcessing || !jobUrls.trim()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 text-zinc-700 text-sm font-medium rounded-xl hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                Save for later
              </button>
              <button
                onClick={handleApply}
                disabled={isProcessing || !jobUrls.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Apply
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Application Progress */}
        {applications.length > 0 && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-soft">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-zinc-900">
                Application Progress
              </h2>
              <Link
                href="/tracker"
                className="inline-flex items-center gap-1 text-sm text-accent hover:text-accent-hover transition-colors"
              >
                View all
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-2">
              {applications.slice(0, 10).map((app, i) => (
                <div
                  key={app.id || i}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-100"
                >
                  {app.status === 'processing' && (
                    <Loader2 className="w-4 h-4 text-accent animate-spin flex-shrink-0" />
                  )}
                  {app.status === 'applied' && (
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  )}
                  {app.status === 'failed' && (
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  )}
                  {app.status === 'pending' && (
                    <div className="w-4 h-4 rounded-full border-2 border-zinc-300 flex-shrink-0" />
                  )}
                  {app.status === 'saved' && (
                    <LinkIcon className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-900 truncate">
                      {app.title
                        ? `${app.title} at ${app.company}`
                        : app.url}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      app.status === 'applied'
                        ? 'bg-emerald-50 text-emerald-600'
                        : app.status === 'failed'
                          ? 'bg-red-50 text-red-600'
                          : app.status === 'processing'
                            ? 'bg-indigo-50 text-indigo-600'
                            : app.status === 'saved'
                              ? 'bg-zinc-100 text-zinc-600'
                              : 'bg-zinc-100 text-zinc-500'
                    }`}
                  >
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {applications.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-zinc-300 p-12 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 mx-auto mb-4">
              <Plus className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-zinc-900">
              No applications yet
            </h3>
            <p className="mt-1 text-sm text-zinc-500">
              Paste job URLs above to get started.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
