import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchApi } from '@/lib/api';
import { paramToBattleTag } from '@/lib/utils';
import { generateUserMetadata } from '@/lib/metadata';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { MmrChart } from '@/components/profile/MmrChart';
import { PlacementChart } from '@/components/profile/PlacementChart';
import { FavoriteHeroes } from '@/components/profile/FavoriteHeroes';
import { RecentMatches } from '@/components/profile/RecentMatches';
import type { UserProfileResponse, MmrPoint } from '@bg-tracker/shared-types';

interface PageProps {
  params: Promise<{ battletag: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { battletag } = await params;
  const tag = paramToBattleTag(battletag);
  return generateUserMetadata(tag);
}

export default async function UserProfilePage({ params }: PageProps) {
  const { battletag } = await params;
  const tag = paramToBattleTag(battletag);

  let profileData: UserProfileResponse | null = null;
  let mmrHistory: MmrPoint[] = [];

  try {
    const [profileRes, mmrRes] = await Promise.all([
      fetchApi<UserProfileResponse>(`/api/users/${encodeURIComponent(tag)}`),
      fetchApi<MmrPoint[]>(`/api/users/${encodeURIComponent(tag)}/mmr`),
    ]);
    profileData = profileRes.data;
    mmrHistory = mmrRes.data;
  } catch {
    notFound();
  }

  if (!profileData) notFound();

  return (
    <div className="space-y-8">
      <ProfileHeader profile={profileData.profile} stats={profileData.stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MmrChart
          initialData={mmrHistory}
          battleTag={tag}
        />
        <PlacementChart stats={profileData.stats} />
      </div>

      <FavoriteHeroes stats={profileData.stats} battleTag={tag} />
      <RecentMatches battleTag={tag} />
    </div>
  );
}
