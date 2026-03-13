import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchApi } from '@/lib/api';
import { getHeroDisplayName } from '@bg-tracker/shared-constants';
import { HeroDetail } from '@/components/meta/HeroDetail';
import type { HeroMetaStats } from '@bg-tracker/shared-types';

export const revalidate = 600;

interface PageProps {
  params: Promise<{ heroCardId: string }>;
}

interface HeroDetailData {
  hero: HeroMetaStats;
  mmrBracketStats: { bracket: string; avgPlacement: number; gamesPlayed: number }[];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { heroCardId } = await params;
  const name = getHeroDisplayName(heroCardId);
  return {
    title: `${name} - 영웅 상세`,
    description: `${name}의 하스스톤 전장 통계 - 평균 등수, MMR 구간별 성적`,
  };
}

export default async function HeroDetailPage({ params }: PageProps) {
  const { heroCardId } = await params;

  let data: HeroDetailData | null = null;

  try {
    const res = await fetchApi<HeroDetailData>(`/api/meta/heroes/${heroCardId}`);
    data = res.data;
  } catch {
    notFound();
  }

  if (!data) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <HeroDetail hero={data.hero} mmrBracketStats={data.mmrBracketStats} />
    </div>
  );
}
