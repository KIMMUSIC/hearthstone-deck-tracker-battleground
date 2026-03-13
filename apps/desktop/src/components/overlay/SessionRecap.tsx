import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/game-store';
import { useSessionStore } from '../../stores/session-store';
import GlassCard from '../common/GlassCard';

const PLACEMENT_STYLES: Record<number, string> = {
  1: 'text-amber-400 text-4xl',
  2: 'text-gray-300 text-4xl',
  3: 'text-amber-600 text-4xl',
  4: 'text-green-400 text-3xl',
  5: 'text-white/60 text-3xl',
  6: 'text-white/50 text-3xl',
  7: 'text-red-400 text-3xl',
  8: 'text-red-500 text-3xl',
};

const PLACEMENT_LABELS: Record<number, string> = {
  1: '1st',
  2: '2nd',
  3: '3rd',
  4: '4th',
  5: '5th',
  6: '6th',
  7: '7th',
  8: '8th',
};

export default function SessionRecap() {
  const placement = useGameStore((s) => s.placement);
  const mmrDelta = useGameStore((s) => s.mmrDelta);
  const matchResults = useSessionStore((s) => s.matchResults);
  const getMmrDelta = useSessionStore((s) => s.getMmrDelta);

  if (placement === null) return null;

  const sessionDelta = getMmrDelta();
  const isTop4 = placement <= 4;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <GlassCard variant="dark" padding="lg" className="w-72 text-center">
        {/* Placement */}
        <motion.div
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1, type: 'spring' }}
          className={`font-black ${PLACEMENT_STYLES[placement] ?? 'text-white text-3xl'}`}
        >
          {PLACEMENT_LABELS[placement] ?? `#${placement}`}
        </motion.div>

        {/* Result indicator */}
        <div className={`text-xs font-medium mt-1 ${isTop4 ? 'text-green-400' : 'text-red-400'}`}>
          {isTop4 ? 'Top 4' : 'Bottom 4'}
        </div>

        {/* MMR Change */}
        {mmrDelta !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-3"
          >
            <span className="text-[10px] text-white/40 uppercase tracking-wider">
              MMR Change
            </span>
            <div
              className={`text-xl font-bold ${
                mmrDelta >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {mmrDelta >= 0 ? '+' : ''}
              {mmrDelta}
            </div>
          </motion.div>
        )}

        {/* Session summary */}
        {matchResults.length > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-3 pt-3 border-t border-white/10"
          >
            <span className="text-[10px] text-white/40 uppercase tracking-wider">
              Session Total
            </span>
            <div className="flex justify-center items-center gap-4 mt-1">
              <div>
                <div className="text-sm font-bold text-white">
                  {matchResults.length}
                </div>
                <div className="text-[9px] text-white/30">Games</div>
              </div>
              <div>
                <div
                  className={`text-sm font-bold ${
                    sessionDelta >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {sessionDelta >= 0 ? '+' : ''}
                  {sessionDelta}
                </div>
                <div className="text-[9px] text-white/30">MMR</div>
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  {(
                    matchResults.reduce((sum, m) => sum + m.placement, 0) /
                    matchResults.length
                  ).toFixed(1)}
                </div>
                <div className="text-[9px] text-white/30">Avg</div>
              </div>
            </div>
          </motion.div>
        )}
      </GlassCard>
    </motion.div>
  );
}
