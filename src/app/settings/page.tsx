'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import {
  User,
  FileText,
  LogOut,
  Trash2,
  AlertTriangle,
  Loader2,
  ChevronRight,
  Shield,
} from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  user_metadata: {
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    background_info?: string;
  };
}

export default function Settings() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
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

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmation !== 'DELETE') return;
    setDeleting(true);

    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.removeItem('user');
        router.push('/');
      } else {
        setMessage(data.message || 'Failed to delete account');
        setDeleting(false);
      }
    } catch {
      setMessage('Failed to delete account. Please try again.');
      setDeleting(false);
    }
  };

  if (loading || !user) return null;

  return (
    <AppShell>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Settings
          </h1>
          <p className="mt-1 text-zinc-500 text-sm">
            Manage your account and preferences.
          </p>
        </div>

        {message && (
          <div className="mb-6 px-4 py-3 rounded-xl text-sm bg-red-50 text-red-600 border border-red-200">
            {message}
          </div>
        )}

        {/* Account section */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-soft overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900">Account</h2>
          </div>

          <div className="divide-y divide-zinc-100">
            {/* Profile info */}
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-100 text-zinc-500">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    {user.user_metadata?.first_name || 'User'}{' '}
                    {user.user_metadata?.last_name || ''}
                  </p>
                  <p className="text-xs text-zinc-500">{user.email}</p>
                </div>
              </div>
              <Link
                href="/profile"
                className="inline-flex items-center gap-1 text-sm text-accent hover:text-accent-hover transition-colors"
              >
                Edit
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Resume */}
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-100 text-zinc-500">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900">Resume</p>
                  <p className="text-xs text-zinc-500">
                    Upload or update your resume
                  </p>
                </div>
              </div>
              <Link
                href="/profile"
                className="inline-flex items-center gap-1 text-sm text-accent hover:text-accent-hover transition-colors"
              >
                Manage
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Background info status */}
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-100 text-zinc-500">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    AI Background
                  </p>
                  <p className="text-xs text-zinc-500">
                    {user.user_metadata?.background_info
                      ? 'Background info set'
                      : 'Not configured yet'}
                  </p>
                </div>
              </div>
              <Link
                href="/profile"
                className="inline-flex items-center gap-1 text-sm text-accent hover:text-accent-hover transition-colors"
              >
                {user.user_metadata?.background_info ? 'Update' : 'Set up'}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Session */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-soft overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900">Session</h2>
          </div>

          <div className="px-6 py-4">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Log out of this device
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-white rounded-2xl border border-red-200 shadow-soft overflow-hidden">
          <div className="px-6 py-4 border-b border-red-100 bg-red-50/50">
            <h2 className="text-sm font-semibold text-red-600">
              Danger Zone
            </h2>
          </div>

          <div className="px-6 py-5">
            <p className="text-sm text-zinc-600 mb-4">
              Once you delete your account, there is no going back. All your
              data will be permanently removed.
            </p>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-xl hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-elevated animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 text-red-500">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900">
                Delete Account
              </h3>
            </div>

            <p className="text-sm text-zinc-600 mb-4">
              This action cannot be undone. This will permanently delete your
              account and remove all your data.
            </p>

            <p className="text-sm text-zinc-600 mb-3">
              Type <span className="font-mono font-semibold">DELETE</span> to
              confirm:
            </p>

            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus-ring mb-5"
              placeholder="Type DELETE to confirm"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteConfirmation('');
                }}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-white border border-zinc-200 text-zinc-700 text-sm font-medium rounded-xl hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== 'DELETE' || deleting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Account'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
