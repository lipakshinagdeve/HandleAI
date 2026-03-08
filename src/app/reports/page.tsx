'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import {
  ApplicationReport as ApplicationReportComponent,
} from '@/components/ApplicationReport';
import type { Report } from '@/components/ApplicationReport';
import {
  FileText,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
} from 'lucide-react';

export default function Reports() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    loadReports();
  }, [router]);

  const loadReports = () => {
    try {
      const stored = localStorage.getItem('application_reports');
      if (stored) {
        setReports(JSON.parse(stored));
      }
    } catch {
      setReports([]);
    }
    setLoading(false);
  };

  const deleteReport = (reportId: string) => {
    const updated = reports.filter((r) => r.id !== reportId);
    setReports(updated);
    localStorage.setItem('application_reports', JSON.stringify(updated));
    if (expandedId === reportId) setExpandedId(null);
  };

  const clearAllReports = () => {
    setReports([]);
    localStorage.removeItem('application_reports');
    setExpandedId(null);
  };

  const toggleExpand = (reportId: string) => {
    setExpandedId((prev) => (prev === reportId ? null : reportId));
  };

  function getDomainFromUrl(url: string): string {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }

  const totalApplied = reports.reduce((sum, r) => sum + r.appliedCount, 0);
  const totalFailed = reports.reduce((sum, r) => sum + r.failedCount, 0);
  const totalJobs = reports.reduce((sum, r) => sum + r.totalJobs, 0);

  return (
    <AppShell>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Application Reports
          </h1>
          <p className="mt-1 text-zinc-500 text-sm">
            Detailed reports from each batch application run.
          </p>
        </div>

        {/* Aggregate stats */}
        {reports.length > 0 && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-zinc-200 p-4">
              <p className="text-2xl font-semibold text-zinc-900">{reports.length}</p>
              <p className="text-xs text-zinc-500 mt-1">Total Runs</p>
            </div>
            <div className="bg-white rounded-2xl border border-zinc-200 p-4">
              <p className="text-2xl font-semibold text-zinc-900">{totalJobs}</p>
              <p className="text-xs text-zinc-500 mt-1">Jobs Found</p>
            </div>
            <div className="bg-white rounded-2xl border border-zinc-200 p-4">
              <p className="text-2xl font-semibold text-emerald-600">{totalApplied}</p>
              <p className="text-xs text-zinc-500 mt-1">Applied</p>
            </div>
            <div className="bg-white rounded-2xl border border-zinc-200 p-4">
              <p className="text-2xl font-semibold text-red-600">{totalFailed}</p>
              <p className="text-xs text-zinc-500 mt-1">Failed</p>
            </div>
          </div>
        )}

        {/* Actions */}
        {reports.length > 0 && (
          <div className="flex justify-end mb-4">
            <button
              onClick={clearAllReports}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear all reports
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
          </div>
        )}

        {/* Reports list */}
        {!loading && reports.length > 0 && (
          <div className="space-y-4">
            {reports.map((report) => {
              const isExpanded = expandedId === report.id;
              return (
                <div key={report.id}>
                  {/* Collapsed summary row */}
                  <div
                    className={`bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-300 hover:shadow-card transition-all duration-200 cursor-pointer ${
                      isExpanded ? 'border-zinc-300 shadow-card' : ''
                    }`}
                    onClick={() => toggleExpand(report.id)}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-light text-accent flex-shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-zinc-900 truncate">
                              {getDomainFromUrl(report.sourceUrl)}
                            </h3>
                            <span className="text-xs text-zinc-400 font-mono flex-shrink-0">
                              {new Date(report.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-zinc-500">
                              {report.totalJobs} job{report.totalJobs !== 1 ? 's' : ''}
                            </span>
                            <span className="text-xs text-emerald-600">
                              {report.appliedCount} applied
                            </span>
                            {report.failedCount > 0 && (
                              <span className="text-xs text-red-600">
                                {report.failedCount} failed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteReport(report.id);
                          }}
                          className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors rounded-lg hover:bg-zinc-100"
                          title="Delete report"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-zinc-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-zinc-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded report */}
                  {isExpanded && (
                    <div className="mt-2">
                      <ApplicationReportComponent report={report} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && reports.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-zinc-300 p-12 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 mx-auto mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-zinc-900">
              No reports yet
            </h3>
            <p className="mt-1 text-sm text-zinc-500">
              Reports are generated each time you apply to jobs from the Dashboard.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
