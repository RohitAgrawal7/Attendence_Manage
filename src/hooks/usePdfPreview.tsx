import { useCallback, useEffect, useState } from 'react';
import { PdfPreviewModal } from '../components/pdf/PdfPreviewModal';

export function usePdfPreview() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [downloadFn, setDownloadFn] = useState<(() => void) | null>(null);

  const closePreview = useCallback(() => {
    setOpen(false);
    setBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setDownloadFn(null);
  }, []);

  const openPreview = useCallback(
    (previewTitle: string, getBlobUrl: () => string, onDownload: () => void) => {
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return getBlobUrl();
      });
      setTitle(previewTitle);
      setDownloadFn(() => onDownload);
      setOpen(true);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  const previewModal = (
    <PdfPreviewModal
      open={open}
      title={title}
      blobUrl={blobUrl}
      onClose={closePreview}
      onDownload={() => downloadFn?.()}
    />
  );

  return { openPreview, closePreview, previewModal };
}
