'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-300 shadow-sm px-6 py-3 flex items-center justify-between">
      <Link href="/dashboard" className="text-lg font-semibold text-gray-900">
        OrgManager
      </Link>
      {user && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user.name}</span>
          <button
            onClick={logout}
            className="text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
