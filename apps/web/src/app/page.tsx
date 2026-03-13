import { SearchBar } from '@/components/search/SearchBar';
import { MetaSummary } from '@/components/home/MetaSummary';
import { RecentSearches } from '@/components/home/RecentSearches';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full px-4 pt-20 pb-16 flex flex-col items-center text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-text-primary mb-4 tracking-tight">
          하스스톤 전장
          <span className="text-primary"> 전적 검색</span>
        </h1>
        <p className="text-text-secondary mb-8 max-w-lg">
          BattleTag를 검색하여 전적, MMR, 영웅 통계를 확인하세요.
        </p>
        <SearchBar />
        <RecentSearches />
      </section>

      {/* Meta Summary */}
      <section className="w-full max-w-5xl px-4 pb-16">
        <MetaSummary />
      </section>
    </div>
  );
}
