'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { battleTagToParam } from '@/lib/utils';

const BATTLE_TAG_REGEX = /^[a-zA-Z0-9\u3131-\uD79D]+[#-]\d{4,6}$/;

export function SearchBar() {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = value.trim();

    if (!tag) {
      setError('BattleTag를 입력하세요.');
      return;
    }

    if (!BATTLE_TAG_REGEX.test(tag)) {
      setError('올바른 BattleTag 형식이 아닙니다. (예: Player#1234)');
      return;
    }

    setError('');
    setLoading(true);

    // Save to recent searches
    saveRecentSearch(tag);

    router.push(`/${battleTagToParam(tag)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError('');
          }}
          placeholder="Player#1234"
          autoFocus
          className="w-full rounded-xl bg-surface-1 border border-border pl-12 pr-24 py-4 text-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
        />
        <button
          type="submit"
          disabled={loading}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover disabled:opacity-60 transition-colors"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '검색'}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-danger">{error}</p>
      )}
    </form>
  );
}

function saveRecentSearch(tag: string) {
  try {
    const stored = localStorage.getItem('recentSearches');
    const searches: string[] = stored ? JSON.parse(stored) : [];
    const filtered = searches.filter((s) => s !== tag);
    filtered.unshift(tag);
    localStorage.setItem('recentSearches', JSON.stringify(filtered.slice(0, 5)));
  } catch {
    // ignore localStorage errors
  }
}
