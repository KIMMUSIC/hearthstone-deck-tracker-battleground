import { motion } from 'framer-motion';
import { useSessionStore } from '../../stores/session-store';
import GlassCard from '../common/GlassCard';

export default function MmrTracker() {
  const mmrCurrent = useSessionStore((s) => s.mmrCurrent);
  const matchResults = useSessionStore((s) => s.matchResults);
  const getMmrDelta = useSessionStore((s) => s.getMmrDelta);

  const delta = getMmrDelta();
  const isPositive = delta > 0;
  const isNeutral = delta === 0;

  return (
    <GlassCard padding="md" className="w-44">
      {/* Header */}
      <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider block mb-2">
        Session MMR
      </span>

      {/* Current MMR */}
      {mmrCurrent !== null && (
        <div className="text-center mb-2">
          <div className="text-lg font-bold text-white">
            {mmrCurrent.toLocaleString()}
          </div>
          <motion.div
            key={delta}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-sm font-bold ${
              isNeutral
                ? 'text-gray-400'
                : isPositive
                  ? 'text-green-400'
                  : 'text-red-400'
            }`}
          >
            {isPositive ? '+' : ''}{delta}
          </motion.div>
        </div>
      )}

      {/* Mini match history */}
      {matchResults.length > 0 && (
        <div className="flex gap-1 justify-center flex-wrap pt-2 border-t border-white/5">
          {matchResults.slice(-8).map((match, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.15, delay: i * 0.05 }}
              className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold ${
                match.placement <= 4
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}
              title={`#${match.placement} (${match.mmrDelta >= 0 ? '+' : ''}${match.mmrDelta})`}
            >
              {match.placement}
            </motion.div>
          ))}
        </div>
      )}

      {/* Games played count */}
      {matchResults.length > 0 && (
        <div className="text-center mt-1.5">
          <span className="text-[9px] text-white/30">
            {matchResults.length} game{matchResults.length !== 1 ? 's' : ''} played
          </span>
        </div>
      )}
    </GlassCard>
  );
}
