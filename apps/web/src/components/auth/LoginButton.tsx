'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { LogIn, LogOut, User } from 'lucide-react';

export function LoginButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="h-9 w-20 rounded-lg bg-surface-2 animate-pulse" />
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-text-secondary hidden sm:block">
          {session.user.battleTag}
        </span>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-surface-1 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">로그아웃</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn('battlenet')}
      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
    >
      <LogIn className="h-4 w-4" />
      로그인
    </button>
  );
}
