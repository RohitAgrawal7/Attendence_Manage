import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color?: string;
}

export function StatCard({ title, value, icon: Icon, color = '#1e3a5f' }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="card-shadow card-hover flex items-center gap-3 rounded-xl bg-white p-4 sm:gap-4 sm:p-5"
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12"
        style={{ backgroundColor: `${color}1a` }}
      >
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color }} />
      </div>
      <div className="min-w-0 text-left">
        <p className="text-xl font-bold text-primary sm:text-2xl">{value}</p>
        <p className="truncate text-xs text-gray-500 sm:text-sm">{title}</p>
      </div>
    </motion.div>
  );
}
