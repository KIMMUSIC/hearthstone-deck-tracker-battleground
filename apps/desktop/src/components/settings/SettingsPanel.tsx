import { motion } from 'framer-motion';
import { useSettingsStore } from '../../stores/settings-store';
import GlassCard from '../common/GlassCard';

const SIM_OPTIONS = [
  { value: 1000, label: '1,000' },
  { value: 5000, label: '5,000' },
  { value: 10000, label: '10,000' },
  { value: 25000, label: '25,000' },
];

function Toggle({
  label,
  enabled,
  onChange,
}: {
  label: string;
  enabled: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className="flex items-center justify-between w-full py-1.5 cursor-pointer group"
    >
      <span className="text-xs text-white/70 group-hover:text-white/90 transition-colors">
        {label}
      </span>
      <div
        className={`w-8 h-4 rounded-full transition-colors duration-200 relative ${
          enabled ? 'bg-green-500/60' : 'bg-white/10'
        }`}
      >
        <motion.div
          className="w-3 h-3 rounded-full bg-white absolute top-0.5"
          animate={{ left: enabled ? 16 : 2 }}
          transition={{ duration: 0.15 }}
        />
      </div>
    </button>
  );
}

export default function SettingsPanel() {
  const {
    overlayOpacity,
    enabledPanels,
    simIterations,
    setOverlayOpacity,
    togglePanel,
    setSimIterations,
    toggleSettings,
  } = useSettingsStore();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <GlassCard variant="dark" padding="lg" className="w-72">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-white">Settings</span>
          <button
            onClick={toggleSettings}
            className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white text-xs transition-colors cursor-pointer"
          >
            x
          </button>
        </div>

        {/* Opacity slider */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-white/60">Overlay Opacity</span>
            <span className="text-white/40">{overlayOpacity}%</span>
          </div>
          <input
            type="range"
            min={20}
            max={100}
            value={overlayOpacity}
            onChange={(e) => setOverlayOpacity(Number(e.target.value))}
            className="w-full h-1 rounded-full appearance-none bg-white/10 cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-3
              [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-white
              [&::-webkit-slider-thumb]:cursor-pointer"
          />
        </div>

        {/* Panel toggles */}
        <div className="mb-4">
          <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider block mb-2">
            Panels
          </span>
          <Toggle
            label="Combat Probability"
            enabled={enabledPanels.combatProbability}
            onChange={() => togglePanel('combatProbability')}
          />
          <Toggle
            label="Opponent Board"
            enabled={enabledPanels.opponentBoard}
            onChange={() => togglePanel('opponentBoard')}
          />
          <Toggle
            label="Tribe Display"
            enabled={enabledPanels.tribeDisplay}
            onChange={() => togglePanel('tribeDisplay')}
          />
          <Toggle
            label="MMR Tracker"
            enabled={enabledPanels.mmrTracker}
            onChange={() => togglePanel('mmrTracker')}
          />
        </div>

        {/* Simulation iterations */}
        <div className="mb-4">
          <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider block mb-2">
            Simulation Iterations
          </span>
          <div className="flex gap-1">
            {SIM_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSimIterations(opt.value)}
                className={`flex-1 py-1 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                  simIterations === opt.value
                    ? 'bg-blue-500/30 text-blue-300 border border-blue-500/40'
                    : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10 hover:text-white/60'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Version info */}
        <div className="pt-2 border-t border-white/5 text-center">
          <span className="text-[9px] text-white/20">BG Tracker v0.1.0</span>
        </div>
      </GlassCard>
    </motion.div>
  );
}
