import Link from 'next/link';
import { Github, Swords } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface-0">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-text-secondary">
            <Swords className="h-4 w-4" />
            <span className="text-sm">BG Tracker</span>
            <span className="text-text-muted text-xs">v0.1.0</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-text-muted">
            <Link href="/meta" className="hover:text-text-secondary transition-colors">
              메타 통계
            </Link>
            <a
              href="https://github.com/KIMMUSIC/hearthstone-deck-tracker-battleground"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-text-secondary transition-colors"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </div>

          <p className="text-xs text-text-muted">
            Hearthstone is a trademark of Blizzard Entertainment.
          </p>
        </div>
      </div>
    </footer>
  );
}
