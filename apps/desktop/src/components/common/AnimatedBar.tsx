import { motion } from 'framer-motion';

interface AnimatedBarProps {
  value: number; // 0-100 percentage
  color: 'win' | 'loss' | 'tie';
  label?: string;
  showValue?: boolean;
  height?: number;
  className?: string;
}

const colorStyles = {
  win: {
    gradient: 'from-green-500 to-green-600',
    glow: 'shadow-[0_0_12px_rgba(34,197,94,0.4)]',
    text: 'text-green-400',
  },
  loss: {
    gradient: 'from-red-500 to-red-600',
    glow: 'shadow-[0_0_12px_rgba(239,68,68,0.4)]',
    text: 'text-red-400',
  },
  tie: {
    gradient: 'from-gray-500 to-gray-600',
    glow: '',
    text: 'text-gray-400',
  },
};

export default function AnimatedBar({
  value,
  color,
  label,
  showValue = true,
  height = 24,
  className = '',
}: AnimatedBarProps) {
  const style = colorStyles[color];
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className={`text-xs font-medium ${style.text}`}>{label}</span>
          )}
          {showValue && (
            <span className={`text-xs font-bold ${style.text}`}>
              {clampedValue.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      <div
        className="w-full bg-white/5 rounded-full overflow-hidden"
        style={{ height }}
      >
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${style.gradient} ${style.glow}`}
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{
            duration: 0.5,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        />
      </div>
    </div>
  );
}
