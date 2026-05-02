"use client";

import { LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export function UserMenu() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const displayName = user.username || `${user.firstName} ${user.lastName}`.trim() || user.userId;
  const initials = user.firstName && user.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user.username?.[0]?.toUpperCase() || user.userId[0];

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/tutor/profile"
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <div className="w-8 h-8 bg-royal-blue text-white rounded-full flex items-center justify-center text-sm font-medium">
          {initials}
        </div>
        <span className="hidden md:inline text-sm font-medium text-gray-700">
          {displayName}
        </span>
      </Link>
      <button
        onClick={logout}
        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
        title="Logout"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}
