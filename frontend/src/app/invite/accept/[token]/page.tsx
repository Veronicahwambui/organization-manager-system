'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';

type Status = 'loading' | 'success' | 'error' | 'already-member' | 'wrong-account';

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');
  const [orgId, setOrgId] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      sessionStorage.setItem('pendingInvite', token as string);
      router.replace(`/auth?invite=${token}`);
      return;
    }

    async function accept() {
      try {
        const { data } = await api.post(`/invite/accept/${token}`, {});
        sessionStorage.removeItem('pendingInvite');
        setStatus('success');
        setMessage(data.message || 'Invite accepted!');
        setOrgId(data.organization_id);
      } catch (err: unknown) {
        const msg =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
            : undefined;

        if (msg === 'You are already a member of this organization') {
          setStatus('already-member');
        } else if (msg?.startsWith('This invite was sent to')) {
          setStatus('wrong-account');
          setMessage(msg);
        } else {
          setStatus('error');
          setMessage(msg || 'Failed to accept invite');
        }
      }
    }

    accept();
  }, [user, authLoading, token, router]);

  if (status === 'loading') return <LoadingSpinner />;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">

        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">You&apos;re in!</h2>
            <p className="text-gray-700 text-sm mb-6">{message}</p>
            <div className="flex flex-col gap-3">
              {orgId && (
                <button
                  onClick={() => router.push(`/organizations/${orgId}`)}
                  className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  View Organization
                </button>
              )}
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-700 text-sm hover:text-gray-900 font-medium"
              >
                Go to Dashboard
              </button>
            </div>
          </>
        )}

        {status === 'already-member' && (
          <>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Already a Member</h2>
            <p className="text-gray-700 text-sm mb-2">
              You&apos;re already part of this organization.
            </p>
            <p className="text-xs text-gray-500 mb-6">
              This invite link is meant for someone else. Share it with the person you want to invite.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Go to Dashboard
            </button>
          </>
        )}

        {status === 'wrong-account' && (
          <>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Wrong Account</h2>
            <p className="text-gray-700 text-sm mb-6">{message}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Go to Dashboard
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Invite Failed</h2>
            <p className="text-gray-700 text-sm mb-6">{message}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Go to Dashboard
            </button>
          </>
        )}

      </div>
    </div>
  );
}
