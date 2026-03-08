'use client';

import {
  CheckCircle,
  XCircle,
  ExternalLink,
  Download,
  X,
  FileText,
  Clock,
} from 'lucide-react';

export interface ReportEntry {
  jobTitle: string;
  companyName: string;
  jobUrl: string;
  status: 'applied' | 'failed';
  errorMessage?: string;
}

export interface Report {
  id: string;
  sourceUrl: string;
  timestamp: string;
  entries: ReportEntry[];
  totalJobs: number;
  appliedCount: number;
  failedCount: number;
}

function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function ApplicationReport({
  report,
  onDismiss,
  compact = false,
}: {
  report: Report;
  onDismiss?: () => void;
  compact?: boolean;
}) {
  const handleDownloadCSV = () => {
    const headers = ['Job Title', 'Company', 'Status', 'Job URL', 'Error'];
    const rows = report.entries.map((e) => [
      `"${e.jobTitle.replace(/"/g, '""')}"`,
      `"${e.companyName.replace(/"/g, '""')}"`,
      e.status === 'applied' ? 'Applied' : 'Failed',
      e.jobUrl,
      e.errorMessage ? `"${e.errorMessage.replace(/"/g, '""')}"` : '',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `application-report-${new Date(report.timestamp).toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-soft overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-light text-accent flex-shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-zinc-900">
                Application Report
              </h3>
              <p className="text-xs text-zinc-500 truncate mt-0.5">
                {getDomainFromUrl(report.sourceUrl)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDownloadCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
              title="Download CSV"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 transition-colors rounded-lg hover:bg-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 divide-x divide-zinc-100 border-b border-zinc-100">
        <div className="px-4 py-3 text-center">
          <p className="text-lg font-semibold text-zinc-900">{report.totalJobs}</p>
          <p className="text-xs text-zinc-500">Total Jobs</p>
        </div>
        <div className="px-4 py-3 text-center">
          <p className="text-lg font-semibold text-emerald-600">{report.appliedCount}</p>
          <p className="text-xs text-zinc-500">Applied</p>
        </div>
        <div className="px-4 py-3 text-center">
          <p className="text-lg font-semibold text-red-600">{report.failedCount}</p>
          <p className="text-xs text-zinc-500">Failed</p>
        </div>
      </div>

      {/* Timestamp + Source */}
      {!compact && (
        <div className="px-6 py-3 border-b border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {new Date(report.timestamp).toLocaleString()}
          </span>
          <a
            href={report.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-accent hover:text-accent-hover transition-colors truncate max-w-[50%]"
          >
            {getDomainFromUrl(report.sourceUrl)}
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
        </div>
      )}

      {/* Job Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left">
              <th className="px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Job Title
              </th>
              <th className="px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider text-center">
                Status
              </th>
              {!compact && (
                <th className="px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider text-right">
                  Link
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {report.entries.map((entry, idx) => (
              <tr
                key={`${entry.jobUrl}-${idx}`}
                className="hover:bg-zinc-50/50 transition-colors"
              >
                <td className="px-6 py-3">
                  <p className="font-medium text-zinc-900 truncate max-w-[250px]">
                    {entry.jobTitle}
                  </p>
                  {entry.errorMessage && (
                    <p className="text-xs text-red-500 mt-0.5 truncate max-w-[250px]">
                      {entry.errorMessage}
                    </p>
                  )}
                </td>
                <td className="px-6 py-3 text-zinc-600 truncate max-w-[180px]">
                  {entry.companyName}
                </td>
                <td className="px-6 py-3 text-center">
                  {entry.status === 'applied' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Applied
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-600">
                      <XCircle className="w-3.5 h-3.5" />
                      Failed
                    </span>
                  )}
                </td>
                {!compact && (
                  <td className="px-6 py-3 text-right">
                    <a
                      href={entry.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open job page"
                      className="inline-flex items-center justify-center p-2 text-zinc-500 hover:text-accent hover:bg-accent/5 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {report.entries.length === 0 && (
        <div className="px-6 py-8 text-center text-sm text-zinc-500">
          No jobs were found on this page.
        </div>
      )}
    </div>
  );
}
