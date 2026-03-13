import type { Metadata } from 'next';
import { generateMetaPageMetadata } from '@/lib/metadata';
import { fetchApi } from '@/lib/api';
import { MetaFilters } from '@/components/meta/MetaFilters';
import { HeroTierList } from '@/components/meta/HeroTierList';
import { TribeAnalysis } from '@/components/meta/TribeAnalysis';
import type { MetaStatsResponse, HeroMetaStats } from '@bg-tracker/shared-types';

export const revalidate = 600; // ISR: 10 minutes

export const metadata: Metadata = generateMetaPageMetadata();

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

interface TribeStatsResponse {
  tribes: TribeStats[];
  updatedAt: string;
}

interface TribeStats {
  race: string;
  appearanceRate: number;
  avgPlacement: number;
  gamesPlayed: number;
}

export default async function MetaPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const gameMode = (params.gameMode as string) ?? '';
  const mmrBracket = (params.mmrBracket as string) ?? '';
  const days = (params.days as string) ?? '7';

  const queryParts: string[] = [];
  if (gameMode) queryParts.push(`gameMode=${gameMode}`);
  if (mmrBracket) queryParts.push(`mmrBracket=${mmrBracket}`);
  if (days) queryParts.push(`days=${days}`);
  const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

  let heroes: HeroMetaStats[] = [];
  let tribes: TribeStats[] = [];

  try {
    const [heroRes, tribeRes] = await Promise.all([
      fetchApi<MetaStatsResponse>(`/api/meta/heroes${query}`),
      fetchApi<TribeStatsResponse>(`/api/meta/tribes${query}`),
    ]);
    heroes = heroRes.data.heroes;
    tribes = tribeRes.data.tribes;
  } catch {
    // Show empty state
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <h1 className="text-3xl font-extrabold text-text-primary">메타 통계</h1>

      <MetaFilters
        gameMode={gameMode}
        mmrBracket={mmrBracket}
        days={days}
      />

      <HeroTierList heroes={heroes} />
      <TribeAnalysis tribes={tribes} />
    </div>
  );
}
