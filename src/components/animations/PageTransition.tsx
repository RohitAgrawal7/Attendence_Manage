import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/** Light fade — keeps pages visible (no blank white flash). */
export function PageTransition({ children, className = '' }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0.96 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.04 } },
};

export const staggerItem = {
  initial: { opacity: 0.85, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.18 } },
};
