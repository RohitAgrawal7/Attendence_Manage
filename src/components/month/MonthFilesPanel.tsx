import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Eye,
  Download,
  Trash2,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import type { MonthFile } from '../../types';
import { api } from '../../services/api';

interface MonthFilesPanelProps {
  year: number;
  month: number;
  monthLabel: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPreviewable(mimeType: string): boolean {
  return (
    mimeType.startsWith('image/') ||
    mimeType === 'application/pdf' ||
    mimeType.startsWith('text/')
  );
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith('image/')) {
    return <ImageIcon className="h-5 w-5" />;
  }
  return <FileText className="h-5 w-5" />;
}

export function MonthFilesPanel({ year, month, monthLabel }: MonthFilesPanelProps) {
  const [files, setFiles] = useState<MonthFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getMonthFiles(year, month);
      setFiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  async function handleUpload(fileList: FileList | null) {
    if (!fileList?.length) return;
    setUploading(true);
    setError('');

    try {
      for (const file of Array.from(fileList)) {
        await api.uploadMonthFile(year, month, file);
      }
      await loadFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleDelete(file: MonthFile) {
    if (!confirm(`Move "${file.originalName}" to Bin? You can restore within 30 days.`)) return;
    try {
      await api.deleteMonthFile(year, month, file.id);
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  function handleView(file: MonthFile) {
    const url = api.monthFileViewUrl(year, month, file.id);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function handleDownload(file: MonthFile) {
    const url = api.monthFileDownloadUrl(year, month, file.id);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.originalName;
    a.click();
  }

  return (
    <section className="card-shadow overflow-hidden rounded-xl bg-white">
      <div className="border-b border-gray-100 bg-gradient-to-r from-primary/5 to-accent/5 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-accent" />
          <div>
            <h3 className="text-lg font-bold text-primary">Month Files</h3>
            <p className="text-xs text-gray-500">
              Upload and view documents for {monthLabel} {year}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleUpload(e.dataTransfer.files);
          }}
          className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
            dragOver
              ? 'border-accent bg-accent/5'
              : 'border-gray-200 bg-gray-50/50 hover:border-accent/40'
          }`}
        >
          <Upload className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm font-medium text-gray-700">
            Drag & drop files here, or click to browse
          </p>
          <p className="mt-1 text-xs text-gray-400">Images, PDF, Word, Excel, text — max 15 MB each</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-60"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Choose Files
              </>
            )}
          </button>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading files…
          </div>
        ) : files.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">No files uploaded for this month yet.</p>
        ) : (
          <ul className="space-y-2">
            <AnimatePresence>
              {files.map((file) => (
                <motion.li
                  key={file.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 sm:p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileIcon mimeType={file.mimeType} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">{file.originalName}</p>
                    <p className="text-xs text-gray-400">
                      {formatSize(file.size)} · {new Date(file.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {isPreviewable(file.mimeType) && (
                      <button
                        type="button"
                        onClick={() => handleView(file)}
                        title="View"
                        className="rounded-lg p-2 text-gray-500 transition hover:bg-accent/10 hover:text-accent"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDownload(file)}
                      title="Download"
                      className="rounded-lg p-2 text-gray-500 transition hover:bg-primary/10 hover:text-primary"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(file)}
                      title="Delete"
                      className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </section>
  );
}
