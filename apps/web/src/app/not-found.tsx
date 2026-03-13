import Link from 'next/link';
import { Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h1 className="text-6xl font-extrabold text-text-muted mb-4">404</h1>
      <h2 className="text-xl font-bold text-text-primary mb-2">
        페이지를 찾을 수 없습니다
      </h2>
      <p className="text-text-secondary mb-8 max-w-md">
        요청한 유저 또는 페이지가 존재하지 않습니다.
        BattleTag를 확인하고 다시 검색해 주세요.
      </p>
      <Link
        href="/"
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-hover transition-colors"
      >
        <Search className="h-4 w-4" />
        메인으로 돌아가기
      </Link>
    </div>
  );
}
