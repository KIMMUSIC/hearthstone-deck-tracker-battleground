'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, X } from 'lucide-react';
import { battleTagToParam, formatBattleTag } from '@/lib/utils';

export function RecentSearches() {
  const [searches, setSearches] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('recentSearches');
      if (stored) setSearches(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  const removeSearch = (tag: string) => {
    const updated = searches.filter((s) => s !== tag);
    setSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  if (searches.length === 0) return null;

  return (
    <div className="mt-6 w-full max-w-xl">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-3.5 w-3.5 text-text-muted" />
        <span className="text-xs text-text-muted">최근 검색</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {searches.map((tag) => (
          <div
            key={tag}
            className="flex items-center gap-1 rounded-lg bg-surface-1 border border-border px-3 py-1.5 text-sm group"
          >
            <Link
              href={`/${battleTagToParam(tag)}`}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              {formatBattleTag(tag)}
            </Link>
            <button
              onClick={() => removeSearch(tag)}
              className="text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
