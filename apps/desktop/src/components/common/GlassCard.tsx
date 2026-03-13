import { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  variant?: 'default' | 'light' | 'dark';
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantStyles = {
  default: 'bg-black/40 backdrop-blur-[12px] border border-white/10',
  light: 'bg-white/8 backdrop-blur-[8px] border border-white/12',
  dark: 'bg-black/60 backdrop-blur-[16px] border border-white/5',
};

const paddingStyles = {
  sm: 'p-2',
  md: 'p-3',
  lg: 'p-4',
};

export default function GlassCard({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...motionProps
}: GlassCardProps) {
  return (
    <motion.div
      className={`${variantStyles[variant]} ${paddingStyles[padding]} rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
