'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Navbar from '@/components/Navbar';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Organization {
  id: string;
  name: string;
  owner_id: string;
  role: string;
  created_at: string;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchOrgs();
    }
  }, [user]);

  async function fetchOrgs() {
    try {
      const { data } = await api.get('/organizations');
      setOrgs(data.organizations);
    } catch {
      setError('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setCreating(true);
    setError('');
    try {
      await api.post('/organizations', { name: newOrgName.trim() });
      setNewOrgName('');
      setShowForm(false);
      fetchOrgs();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      setError(msg || 'Failed to create organization');
    } finally {
      setCreating(false);
    }
  }

  if (authLoading || loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Your Organizations</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + New Organization
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex gap-3">
            <input
              type="text"
              required
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              placeholder="Organization name"
              className="flex-1 border border-gray-400 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={creating}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </form>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>
        )}

        {orgs.length === 0 ? (
          <div className="text-center text-gray-500 py-16">
            <p className="text-lg mb-2">No organizations yet</p>
            <p className="text-sm">Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orgs.map((org) => (
              <Link
                key={org.id}
                href={`/organizations/${org.id}`}
                onClick={() => sessionStorage.setItem('currentOrg', JSON.stringify({ id: org.id, name: org.name, role: org.role }))}
                className="block bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-blue-400 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{org.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 capitalize">{org.role}</p>
                  </div>
                  <span className="text-gray-400 text-sm">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
