'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Menu, X, BarChart3, Trophy, Swords } from 'lucide-react';
import { cn, battleTagToParam } from '@/lib/utils';

export function Navbar() {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = searchValue.trim();
    if (!tag) return;
    router.push(`/${battleTagToParam(tag)}`);
    setSearchValue('');
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Swords className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-text-primary hidden sm:block">
              BG Tracker
            </span>
          </Link>

          {/* Search bar - desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="BattleTag 검색 (Player#1234)"
                className="w-full rounded-lg bg-surface-1 border border-border pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </form>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink href="/meta" icon={<BarChart3 className="h-4 w-4" />}>
              메타 통계
            </NavLink>
            <NavLink href="/meta/heroes" icon={<Trophy className="h-4 w-4" />}>
              영웅 티어
            </NavLink>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-1 transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-surface-0 px-4 py-4 space-y-3">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="BattleTag 검색"
                className="w-full rounded-lg bg-surface-1 border border-border pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
              />
            </div>
          </form>
          <Link
            href="/meta"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-1"
          >
            <BarChart3 className="h-4 w-4" />
            메타 통계
          </Link>
          <Link
            href="/meta/heroes"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-1"
          >
            <Trophy className="h-4 w-4" />
            영웅 티어
          </Link>
        </div>
      )}
    </nav>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium',
        'text-text-secondary hover:text-text-primary hover:bg-surface-1 transition-colors',
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
