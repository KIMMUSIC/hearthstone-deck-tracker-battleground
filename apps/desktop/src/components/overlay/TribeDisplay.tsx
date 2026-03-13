import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/game-store';
import GlassCard from '../common/GlassCard';

// Race ID to display name mapping
const RACE_NAMES: Record<number, string> = {
  20: 'Beast',
  15: 'Demon',
  24: 'Dragon',
  18: 'Elemental',
  17: 'Mech',
  14: 'Murloc',
  92: 'Naga',
  23: 'Pirate',
  43: 'Quilboar',
  11: 'Undead',
};

// Race ID to short icon/symbol
const RACE_ICONS: Record<number, string> = {
  20: 'Be',
  15: 'De',
  24: 'Dr',
  18: 'El',
  17: 'Me',
  14: 'Mu',
  92: 'Na',
  23: 'Pi',
  43: 'Qu',
  11: 'Un',
};

// Race-specific colors for visual distinction
const RACE_COLORS: Record<number, string> = {
  20: 'bg-amber-600/30 text-amber-300 border-amber-500/30',
  15: 'bg-purple-600/30 text-purple-300 border-purple-500/30',
  24: 'bg-red-600/30 text-red-300 border-red-500/30',
  18: 'bg-blue-600/30 text-blue-300 border-blue-500/30',
  17: 'bg-zinc-600/30 text-zinc-300 border-zinc-500/30',
  14: 'bg-cyan-600/30 text-cyan-300 border-cyan-500/30',
  92: 'bg-teal-600/30 text-teal-300 border-teal-500/30',
  23: 'bg-orange-600/30 text-orange-300 border-orange-500/30',
  43: 'bg-rose-600/30 text-rose-300 border-rose-500/30',
  11: 'bg-emerald-600/30 text-emerald-300 border-emerald-500/30',
};

const ALL_RACE_IDS = Object.keys(RACE_NAMES).map(Number);

export default function TribeDisplay() {
  const availableRaces = useGameStore((s) => s.availableRaces);

  if (availableRaces.length === 0) return null;

  const bannedRaces = ALL_RACE_IDS.filter(
    (id) => !availableRaces.includes(id),
  );

  return (
    <GlassCard padding="sm" className="w-auto">
      <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider mb-2 block px-1">
        Tribes
      </span>

      {/* Available races */}
      <div className="flex flex-wrap gap-1 mb-1">
        {availableRaces
          .filter((id) => RACE_NAMES[id])
          .map((raceId, i) => (
            <motion.div
              key={raceId}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.15, delay: i * 0.03 }}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium ${RACE_COLORS[raceId] ?? 'bg-white/10 text-white/60 border-white/10'}`}
            >
              <span className="font-bold text-[9px] opacity-70">
                {RACE_ICONS[raceId]}
              </span>
              <span>{RACE_NAMES[raceId]}</span>
            </motion.div>
          ))}
      </div>

      {/* Banned races */}
      {bannedRaces.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1 border-t border-white/5">
          {bannedRaces
            .filter((id) => RACE_NAMES[id])
            .map((raceId) => (
              <div
                key={raceId}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-white/5 text-[10px] text-white/20 line-through"
              >
                <span className="font-bold text-[9px]">{RACE_ICONS[raceId]}</span>
                <span>{RACE_NAMES[raceId]}</span>
              </div>
            ))}
        </div>
      )}
    </GlassCard>
  );
}
