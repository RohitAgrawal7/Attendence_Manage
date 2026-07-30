import { Eye, FileDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface PdfButtonProps {
  onDownload: () => void;
  onPreview?: () => void;
  label?: string;
  previewLabel?: string;
  /** header = light-on-dark; solid = primary filled download */
  variant?: 'header' | 'solid' | 'outline';
}

export function PdfButton({
  onDownload,
  onPreview,
  label = 'Download PDF',
  previewLabel = 'Preview PDF',
  variant = 'header',
}: PdfButtonProps) {
  const headerCls =
    'inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2.5 text-xs font-semibold text-white transition hover:bg-white/20 sm:px-3 sm:text-sm';
  const solidCls =
    'inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-white hover:bg-primary-light sm:text-sm';
  const outlineCls =
    'inline-flex h-9 items-center gap-1.5 rounded-lg border border-primary/20 bg-white px-3 text-xs font-semibold text-primary hover:bg-primary/5 sm:text-sm';

  const previewCls = variant === 'header' ? headerCls : outlineCls;
  const downloadCls = variant === 'header' ? headerCls : solidCls;

  return (
    <div className="flex items-center gap-2">
      {onPreview && (
        <motion.button
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onPreview}
          className={previewCls}
          title={previewLabel}
        >
          <Eye className="h-4 w-4" />
          <span className="hidden sm:inline">{previewLabel}</span>
        </motion.button>
      )}
      <motion.button
        type="button"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={onDownload}
        className={downloadCls}
        title={label}
      >
        <FileDown className="h-4 w-4" />
        <span className="hidden sm:inline">{label}</span>
      </motion.button>
    </div>
  );
}
