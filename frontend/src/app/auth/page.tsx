'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

type Tab = 'login' | 'register';

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 012.07-3.368M6.5 6.5A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.973 9.973 0 01-1.15 2.318M15 12a3 3 0 00-3-3m0 0a3 3 0 00-2.121.879M3 3l18 18" />
    </svg>
  );
}

export default function AuthPage() {
  const [tab, setTab] = useState<Tab>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite');

  function switchTab(t: Tab) {
    setTab(t);
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirm(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (tab === 'register' && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      if (tab === 'login') {
        const { data } = await api.post('/auth/login', { email, password });
        login(data.token, data.user);
        const pending = sessionStorage.getItem('pendingInvite') || inviteToken;
        router.push(pending ? `/invite/accept/${pending}` : '/dashboard');
      } else {
        await api.post('/auth/register', { name, email, password });
        setSuccess('Account created! Please sign in.');
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setTab('login');
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      setError(msg || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full border border-gray-400 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelClass = 'block text-sm font-semibold text-gray-800 mb-1';

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">Organization Manager</h1>

        <div className="flex border-b border-gray-200 mb-6">
          {(['login', 'register'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className={`flex-1 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                tab === t
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <div>
              <label className={labelClass}>Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="John Doe"
              />
            </div>
          )}

          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className={labelClass}>Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClass} pr-10`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                tabIndex={-1}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          {tab === 'register' && (
            <div>
              <label className={labelClass}>Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`${inputClass} pr-10`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                  tabIndex={-1}
                >
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
            </div>
          )}

          {success && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              {success}
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
