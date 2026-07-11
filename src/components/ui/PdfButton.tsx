import { FileDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface PdfButtonProps {
  onClick: () => void;
  label?: string;
}

export function PdfButton({ onClick, label = 'Export PDF' }: PdfButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25 sm:px-4 sm:py-2"
      title={label}
    >
      <FileDown className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </motion.button>
  );
}
