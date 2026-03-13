import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/game-store';
import GlassCard from '../common/GlassCard';

interface MinionDisplay {
  cardId: string;
  attack: number;
  health: number;
  golden: boolean;
  taunt: boolean;
  divineShield: boolean;
  poisonous: boolean;
  venomous: boolean;
  reborn: boolean;
  tier: number;
}

function MinionCard({ minion, index }: { minion: MinionDisplay; index: number }) {
  const borderClasses = [
    minion.golden ? 'border-amber-400/60' : 'border-white/10',
    minion.taunt ? 'ring-1 ring-yellow-400/40' : '',
  ].join(' ');

  return (
    <motion.div
      className={`relative flex flex-col items-center justify-center w-10 h-14 rounded-lg bg-white/5 border ${borderClasses} text-[10px]`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
    >
      {/* Divine Shield glow */}
      {minion.divineShield && (
        <div className="absolute inset-0 rounded-lg ring-1 ring-yellow-300/50 shadow-[0_0_6px_rgba(253,224,71,0.3)]" />
      )}

      {/* Tier indicator */}
      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-500/80 text-[7px] flex items-center justify-center font-bold">
        {minion.tier}
      </div>

      {/* Keywords */}
      <div className="flex gap-0.5 mb-0.5">
        {minion.poisonous && <span className="text-green-400 text-[8px]">P</span>}
        {minion.venomous && <span className="text-emerald-300 text-[8px]">V</span>}
        {minion.reborn && <span className="text-purple-400 text-[8px]">R</span>}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-1 font-bold">
        <span className="text-yellow-400">{minion.attack}</span>
        <span className="text-white/30">/</span>
        <span className="text-green-400">{minion.health}</span>
      </div>

      {/* Golden indicator */}
      {minion.golden && (
        <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-amber-400/60" />
      )}
    </motion.div>
  );
}

export default function OpponentBoard() {
  const opponentBoard = useGameStore((s) => s.opponentBoard);
  const opponentHeroCardId = useGameStore((s) => s.opponentHeroCardId);

  if (opponentBoard.length === 0) {
    return (
      <GlassCard padding="md" className="w-auto">
        <div className="text-center text-white/30 text-xs py-1">
          No board data
        </div>
      </GlassCard>
    );
  }

  // Extract heroname from cardId (e.g., "BG_HERO_202" -> short display)
  const heroName = opponentHeroCardId
    ? opponentHeroCardId.replace(/^BG_HERO_|^TB_BaconShop_HERO_/i, '').slice(0, 8)
    : 'Opponent';

  return (
    <GlassCard padding="sm" className="w-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">
          Opponent Board
        </span>
        <span className="text-[10px] text-white/40">{heroName}</span>
      </div>

      {/* Minion cards row */}
      <div className="flex gap-1 justify-center">
        {opponentBoard.map((minion, i) => (
          <MinionCard
            key={minion.id ?? i}
            minion={minion as MinionDisplay}
            index={i}
          />
        ))}
      </div>
    </GlassCard>
  );
}
