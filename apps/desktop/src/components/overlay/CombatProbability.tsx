import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/game-store';
import GlassCard from '../common/GlassCard';

export default function CombatProbability() {
  const simResult = useGameStore((s) => s.simResult);

  if (!simResult) {
    return (
      <GlassCard padding="md" className="w-56">
        <div className="text-center text-white/40 text-xs py-2">
          Calculating...
        </div>
      </GlassCard>
    );
  }

  const winPct = simResult.winRate * 100;
  const lossPct = simResult.lossRate * 100;
  const tiePct = simResult.tieRate * 100;

  return (
    <GlassCard padding="md" className="w-56">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">
          Combat Odds
        </span>
        <span className="text-[10px] text-white/30">
          {simResult.simulationCount.toLocaleString()} sims
        </span>
      </div>

      {/* Combined Bar */}
      <div className="h-6 rounded-full overflow-hidden flex mb-3 bg-white/5">
        <motion.div
          className="h-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center"
          animate={{ width: `${winPct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {winPct >= 15 && (
            <span className="text-[10px] font-bold text-white drop-shadow">
              {winPct.toFixed(0)}%
            </span>
          )}
        </motion.div>
        <motion.div
          className="h-full bg-gradient-to-r from-gray-500 to-gray-600 flex items-center justify-center"
          animate={{ width: `${tiePct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {tiePct >= 15 && (
            <span className="text-[10px] font-bold text-white drop-shadow">
              {tiePct.toFixed(0)}%
            </span>
          )}
        </motion.div>
        <motion.div
          className="h-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center"
          animate={{ width: `${lossPct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {lossPct >= 15 && (
            <span className="text-[10px] font-bold text-white drop-shadow">
              {lossPct.toFixed(0)}%
            </span>
          )}
        </motion.div>
      </div>

      {/* Labels */}
      <div className="flex justify-between text-[10px]">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-green-400 font-medium">{winPct.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-gray-500" />
          <span className="text-gray-400 font-medium">{tiePct.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-red-400 font-medium">{lossPct.toFixed(1)}%</span>
        </div>
      </div>

      {/* Death rates */}
      <AnimatePresence>
        {(simResult.myDeathRate > 0 || simResult.theirDeathRate > 0) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 pt-2 border-t border-white/5"
          >
            <div className="flex justify-between text-[10px] text-white/40">
              {simResult.myDeathRate > 0 && (
                <span>My death: {(simResult.myDeathRate * 100).toFixed(1)}%</span>
              )}
              {simResult.theirDeathRate > 0 && (
                <span>Their death: {(simResult.theirDeathRate * 100).toFixed(1)}%</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
