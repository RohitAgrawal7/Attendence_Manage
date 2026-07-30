import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArchiveRestore,
  Calendar,
  FileText,
  Trash2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { PageTransition } from '../components/animations/PageTransition';
import { api } from '../services/api';
import { useData } from '../context/DataContext';
import type { TrashItem } from '../types';
import { monthName } from '../utils/formatters';

const RETENTION_DAYS = 30;

function typeLabel(type: TrashItem['type']) {
  return type === 'session' ? 'Session' : 'Uploaded file';
}

function typeIcon(type: TrashItem['type']) {
  return type === 'session' ? Calendar : FileText;
}

export function BinPage() {
  const { refresh } = useData();
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadTrash = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getTrash();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bin');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTrash();
  }, [loadTrash]);

  async function handleRestore(item: TrashItem) {
    setBusyId(item.id);
    try {
      if (item.type === 'session' && item.dateKey) {
        await api.restoreTrashSession(item.dateKey);
      } else {
        await api.restoreTrashFile(item.id);
      }
      await refresh();
      await loadTrash();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restore failed');
    } finally {
      setBusyId(null);
    }
  }

  async function handlePermanentDelete(item: TrashItem) {
    const msg =
      item.type === 'session'
        ? `Permanently delete session "${item.label}"? This cannot be undone.`
        : `Permanently delete file "${item.label}"? This cannot be undone.`;

    if (!confirm(msg)) return;

    setBusyId(item.id);
    try {
      if (item.type === 'session' && item.dateKey) {
        await api.permanentlyDeleteTrashSession(item.dateKey);
      } else {
        await api.permanentlyDeleteTrashFile(item.id);
      }
      await loadTrash();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <PageTransition>
      <Header title="Bin" />
      <Breadcrumb items={[{ label: 'Bin' }]} />

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900">30-day retention policy</p>
              <p className="mt-1 text-sm text-amber-800/90">
                Deleted sessions and month files stay here for {RETENTION_DAYS} days. Restore anytime
                before expiry, or delete permanently now. Items are auto-removed after {RETENTION_DAYS} days.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-200/70" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="card-shadow rounded-xl bg-white py-16 text-center">
            <Trash2 className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 font-medium text-gray-700">Bin is empty</p>
            <p className="mt-1 text-sm text-gray-500">
              Deleted month data and sessions will appear here.
            </p>
            <Link to="/" className="mt-4 inline-block text-sm font-medium text-accent hover:underline">
              Back to dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">{items.length} item(s) in bin</p>
            {items.map((item) => {
              const Icon = typeIcon(item.type);
              const isBusy = busyId === item.id;
              const location =
                item.year && item.month
                  ? `${monthName(item.month)} ${item.year}`
                  : item.detail;

              return (
                <motion.div
                  key={`${item.type}-${item.id}`}
                  layout
                  className="card-shadow overflow-hidden rounded-xl bg-white"
                >
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                            {typeLabel(item.type)}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3.5 w-3.5" />
                            {item.daysRemaining} day{item.daysRemaining === 1 ? '' : 's'} left
                          </span>
                        </div>
                        <p className="mt-1 truncate font-semibold text-gray-900">{item.label}</p>
                        {location && (
                          <p className="mt-0.5 text-xs text-gray-500">{location}</p>
                        )}
                        {item.detail && item.type === 'session' && (
                          <p className="mt-0.5 text-xs text-gray-500">Topic: {item.detail}</p>
                        )}
                        <p className="mt-1 text-[11px] text-gray-400">
                          Deleted {new Date(item.deletedAt).toLocaleString()} • Expires{' '}
                          {new Date(item.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleRestore(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-50 sm:text-sm"
                      >
                        <ArchiveRestore className="h-4 w-4" />
                        Restore
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handlePermanentDelete(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 sm:text-sm"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete forever
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
