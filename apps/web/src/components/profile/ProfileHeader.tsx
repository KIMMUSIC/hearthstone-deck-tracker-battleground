import { Gamepad2, Target, TrendingUp, Trophy } from 'lucide-react';
import { StatCard } from '@/components/common/StatCard';
import { getHeroDisplayName } from '@bg-tracker/shared-constants';
import { formatDate } from '@/lib/utils';
import type { UserProfile, UserStats } from '@bg-tracker/shared-types';

interface ProfileHeaderProps {
  profile: UserProfile;
  stats: UserStats;
}

export function ProfileHeader({ profile, stats }: ProfileHeaderProps) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">
          {profile.battleTag}
        </h1>
        <p className="text-sm text-text-muted mt-1">
          가입일: {formatDate(profile.createdAt)}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="총 게임"
          value={stats.totalGames}
          icon={Gamepad2}
        />
        <StatCard
          label="평균 등수"
          value={stats.avgPlacement.toFixed(2)}
          icon={Target}
        />
        <StatCard
          label="Top 4 비율"
          value={`${(stats.top4Rate * 100).toFixed(1)}%`}
          icon={TrendingUp}
        />
        <StatCard
          label="선호 영웅"
          value={getHeroDisplayName(stats.favoriteHero)}
          icon={Trophy}
        />
      </div>
    </div>
  );
}
