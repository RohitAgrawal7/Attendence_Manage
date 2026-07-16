import { useEffect } from 'react';
import { X, FileDown, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PdfPreviewModalProps {
  open: boolean;
  title: string;
  blobUrl: string | null;
  onClose: () => void;
  onDownload: () => void;
}

export function PdfPreviewModal({
  open,
  title,
  blobUrl,
  onClose,
  onDownload,
}: PdfPreviewModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && blobUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            onClick={(e) => e.stopPropagation()}
            className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-primary px-4 py-3 text-white sm:px-5">
              <div className="flex min-w-0 items-center gap-2">
                <Eye className="h-5 w-5 shrink-0" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{title}</p>
                  <p className="text-xs text-white/70">PDF Preview</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onDownload}
                  className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/25"
                >
                  <FileDown className="h-4 w-4" /> Download
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25"
                  aria-label="Close preview"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <iframe
              title={title}
              src={blobUrl}
              className="h-full w-full flex-1 border-0 bg-gray-100"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
