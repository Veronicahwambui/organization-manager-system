'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Navbar from '@/components/Navbar';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  joined_at: string;
}

export default function OrganizationPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [orgName, setOrgName] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth');
  }, [user, authLoading, router]);

  useEffect(() => {
    const saved = sessionStorage.getItem('currentOrg');
    if (saved) {
      const org = JSON.parse(saved);
      if (org.id === id) setOrgName(org.name);
    }
  }, [id]);

  useEffect(() => {
    if (user) fetchMembers();
  }, [user, id]);

  async function fetchMembers() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/organizations/${id}/members`);
      setMembers(data.members);
    } catch {
      setError('Failed to load members. You may not be a member of this organization.');
    } finally {
      setLoading(false);
    }
  }

  const currentUserRole = members.find((m) => m.id === user?.id)?.role;

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    setInviting(true);
    setInviteError('');
    setInviteLink('');
    try {
      const { data } = await api.post(`/organizations/${id}/invite`, {
        email: inviteEmail,
        role: inviteRole,
      });
      setInviteLink(data.link);
      setInviteEmail('');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      setInviteError(msg || 'Failed to send invite');
    } finally {
      setInviting(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      const el = document.createElement('textarea');
      el.value = inviteLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (authLoading || loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">

        <button
          onClick={() => router.back()}
          className="text-sm text-black font-semibold mb-4 inline-flex items-center gap-1 hover:text-blue-600"
        >
          ← Back to Dashboard
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            {orgName && <h1 className="text-2xl font-extrabold text-black">{orgName}</h1>}
            {currentUserRole && (
              <span className={`inline-block mt-1 text-xs font-bold px-3 py-1 rounded-full capitalize ${
                currentUserRole === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'
              }`}>
                Your role: {currentUserRole}
              </span>
            )}
          </div>
          {currentUserRole === 'admin' && (
            <button
              onClick={() => { setShowInviteForm(!showInviteForm); setInviteLink(''); setInviteError(''); }}
              className={`text-sm px-4 py-2 rounded-lg font-bold transition-colors ${
                showInviteForm
                  ? 'bg-gray-300 text-gray-900 hover:bg-gray-400'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {showInviteForm ? '✕ Cancel' : '+ Invite Member'}
            </button>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-6">{error}</p>
        )}

        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-extrabold text-black">
              Members
              <span className="ml-2 text-sm font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
                {members.length}
              </span>
            </h2>
            <button
              onClick={fetchMembers}
              className="text-xs text-gray-600 hover:text-gray-900 font-medium border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Refresh
            </button>
          </div>

          {members.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl px-5 py-10 text-center">
              <p className="text-gray-700 font-medium">No members yet</p>
              <p className="text-sm text-gray-500 mt-1">Invite someone to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-sm text-gray-900">
                      {m.name}
                      {m.id === user?.id && (
                        <span className="ml-2 text-xs text-gray-400 font-normal">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">{m.email}</p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                      m.role === 'admin'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {currentUserRole === 'admin' && showInviteForm && (
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 text-base mb-4">Invite a Member</h3>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full border border-gray-400 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'member' | 'admin')}
                  className="w-full border border-gray-400 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {inviteError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {inviteError}
                </p>
              )}

              <button
                type="submit"
                disabled={inviting}
                className="bg-blue-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
              >
                {inviting ? 'Generating link...' : 'Generate Invite Link'}
              </button>
            </form>

            {inviteLink && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-bold text-green-800 mb-1">Invite link ready!</p>
                <p className="text-xs text-gray-700 mb-3">
                  Copy and share this link. The person must open it in their browser and register or log in to join.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={inviteLink}
                    className="flex-1 border border-gray-400 rounded-lg px-3 py-2 text-xs text-gray-900 font-medium bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={`text-xs px-3 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                      copied ? 'bg-green-600 text-white' : 'bg-gray-900 text-white hover:bg-black'
                    }`}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
