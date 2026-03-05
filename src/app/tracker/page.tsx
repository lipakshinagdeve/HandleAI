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
  Loader2,
} from 'lucide-react';

type Status = 'all' | 'saved' | 'applied' | 'interviewing' | 'offered' | 'rejected';

interface TrackedApplication {
  id: string;
  job_url: string;
  position: string;
  company: string;
  status: 'saved' | 'applied' | 'interviewing' | 'offered' | 'rejected';
  applied_at: string;
}

const statusConfig: Record<string, { icon: typeof CheckCircle; label: string; classes: string; dot: string }> = {
  saved: {
    icon: Clock,
    label: 'Saved',
    classes: 'bg-zinc-50 text-zinc-600',
    dot: 'bg-zinc-400',
  },
  applied: {
    icon: CheckCircle,
    label: 'Applied',
    classes: 'bg-emerald-50 text-emerald-600',
    dot: 'bg-emerald-400',
  },
  interviewing: {
    icon: Clock,
    label: 'Interviewing',
    classes: 'bg-blue-50 text-blue-600',
    dot: 'bg-blue-400',
  },
  offered: {
    icon: CheckCircle,
    label: 'Offered',
    classes: 'bg-violet-50 text-violet-600',
    dot: 'bg-violet-400',
  },
  rejected: {
    icon: XCircle,
    label: 'Rejected',
    classes: 'bg-red-50 text-red-600',
    dot: 'bg-red-400',
  },
};

export default function Tracker() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<Status>('all');
  const [search, setSearch] = useState('');
  const [applications, setApplications] = useState<TrackedApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userData);
    loadApplications(user.id);
  }, [router]);

  const loadApplications = async (userId: string) => {
    try {
      const res = await fetch(`/api/applications?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = applications.filter((app) => {
    const matchesFilter =
      activeFilter === 'all' || app.status === activeFilter;
    const matchesSearch =
      app.position.toLowerCase().includes(search.toLowerCase()) ||
      app.company.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = {
    all: applications.length,
    saved: applications.filter((a) => a.status === 'saved').length,
    applied: applications.filter((a) => a.status === 'applied').length,
    interviewing: applications.filter((a) => a.status === 'interviewing').length,
    offered: applications.filter((a) => a.status === 'offered').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  };

  const filterOptions: Status[] = ['all', 'saved', 'applied', 'interviewing', 'offered', 'rejected'];

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
          <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl overflow-x-auto">
            {filterOptions.map((status) => (
              <button
                key={status}
                onClick={() => setActiveFilter(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                  activeFilter === status
                    ? 'bg-white text-zinc-900 shadow-soft'
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {counts[status] > 0 && (
                  <span className="ml-1.5 text-zinc-400">
                    {counts[status]}
                  </span>
                )}
              </button>
            ))}
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

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
          </div>
        )}

        {/* Applications list */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map((app) => {
              const config = statusConfig[app.status] || statusConfig.applied;
              return (
                <div
                  key={app.id}
                  className="group bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-300 hover:shadow-card transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-sm font-semibold text-zinc-900 truncate">
                          {app.position}
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
                        {new Date(app.applied_at).toLocaleDateString()}
                      </p>
                    </div>
                    {app.job_url && (
                      <a
                        href={app.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
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
