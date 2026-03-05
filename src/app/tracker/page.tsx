'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import {
  Search,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  ListChecks,
} from 'lucide-react';

type Status = 'all' | 'pending' | 'applied' | 'failed';

interface TrackedApplication {
  id: string;
  url: string;
  title: string;
  company: string;
  status: 'pending' | 'applied' | 'failed';
  appliedAt: string;
}

const statusConfig = {
  pending: {
    icon: Clock,
    label: 'Pending',
    classes: 'bg-amber-50 text-amber-600',
    dot: 'bg-amber-400',
  },
  applied: {
    icon: CheckCircle,
    label: 'Applied',
    classes: 'bg-emerald-50 text-emerald-600',
    dot: 'bg-emerald-400',
  },
  failed: {
    icon: XCircle,
    label: 'Failed',
    classes: 'bg-red-50 text-red-600',
    dot: 'bg-red-400',
  },
};

const mockApplications: TrackedApplication[] = [
  {
    id: '1',
    url: 'https://stripe.com/jobs/engineering',
    title: 'Senior Frontend Engineer',
    company: 'Stripe',
    status: 'applied',
    appliedAt: '2026-03-04',
  },
  {
    id: '2',
    url: 'https://linear.app/careers',
    title: 'Product Designer',
    company: 'Linear',
    status: 'applied',
    appliedAt: '2026-03-03',
  },
  {
    id: '3',
    url: 'https://vercel.com/careers',
    title: 'Full Stack Developer',
    company: 'Vercel',
    status: 'pending',
    appliedAt: '2026-03-05',
  },
  {
    id: '4',
    url: 'https://notion.so/careers',
    title: 'Software Engineer',
    company: 'Notion',
    status: 'failed',
    appliedAt: '2026-03-02',
  },
];

export default function Tracker() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<Status>('all');
  const [search, setSearch] = useState('');
  const [applications] = useState<TrackedApplication[]>(mockApplications);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) router.push('/login');
  }, [router]);

  const filtered = applications.filter((app) => {
    const matchesFilter =
      activeFilter === 'all' || app.status === activeFilter;
    const matchesSearch =
      app.title.toLowerCase().includes(search.toLowerCase()) ||
      app.company.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    applied: applications.filter((a) => a.status === 'applied').length,
    failed: applications.filter((a) => a.status === 'failed').length,
  };

  return (
    <AppShell>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Application Tracker
          </h1>
          <p className="mt-1 text-zinc-500 text-sm">
            Monitor and filter all your job applications.
          </p>
        </div>

        {/* Filters + Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl">
            {(['all', 'pending', 'applied', 'failed'] as Status[]).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setActiveFilter(status)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                    activeFilter === status
                      ? 'bg-white text-zinc-900 shadow-soft'
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                  <span className="ml-1.5 text-zinc-400">
                    {counts[status]}
                  </span>
                </button>
              )
            )}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search applications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus-ring"
            />
          </div>
        </div>

        {/* Applications list */}
        {filtered.length > 0 ? (
          <div className="space-y-2">
            {filtered.map((app) => {
              const config = statusConfig[app.status];
              return (
                <div
                  key={app.id}
                  className="group bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-300 hover:shadow-card transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-sm font-semibold text-zinc-900 truncate">
                          {app.title}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${config.classes}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${config.dot}`}
                          />
                          {config.label}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500">{app.company}</p>
                      <p className="text-xs text-zinc-400 mt-2 font-mono">
                        {app.appliedAt}
                      </p>
                    </div>
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-zinc-300 p-12 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 mx-auto mb-4">
              <ListChecks className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-zinc-900">
              {search || activeFilter !== 'all'
                ? 'No matching applications'
                : 'No applications tracked yet'}
            </h3>
            <p className="mt-1 text-sm text-zinc-500">
              {search || activeFilter !== 'all'
                ? 'Try adjusting your filters or search.'
                : 'Apply to jobs from the Dashboard to see them here.'}
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
