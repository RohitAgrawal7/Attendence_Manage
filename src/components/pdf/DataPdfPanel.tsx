import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, X, FileDown, ChevronDown } from 'lucide-react';
import type { DataPdfEntry } from '../../types';
import {
  getCustomPdfEntries,
  removeCustomPdfEntry,
  saveCustomPdfEntry,
} from '../../utils/dataPdfHelpers';

interface DataPdfPanelProps {
  scopeKey: string;
  title?: string;
  entries: DataPdfEntry[];
  onExport: (entry: DataPdfEntry) => void;
}

export function DataPdfPanel({
  scopeKey,
  title = 'Data PDF Reports',
  entries,
  onExport,
}: DataPdfPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customEntries, setCustomEntries] = useState<DataPdfEntry[]>(() =>
    getCustomPdfEntries(scopeKey),
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTopic, setNewTopic] = useState('');

  const allEntries = useMemo(
    () => [...entries, ...customEntries],
    [entries, customEntries],
  );

  const [selectedId, setSelectedId] = useState<string>(() => allEntries[0]?.id ?? '');

  useEffect(() => {
    if (!allEntries.length) {
      setSelectedId('');
      return;
    }
    if (!allEntries.some((e) => e.id === selectedId)) {
      setSelectedId(allEntries[0].id);
    }
  }, [allEntries, selectedId]);

  const selectedEntry = allEntries.find((e) => e.id === selectedId);

  function handleAdd() {
    const name = newName.trim();
    if (!name) return;

    const entry: DataPdfEntry = {
      id: `custom-${Date.now()}`,
      name,
      topics: newTopic.trim() ? [newTopic.trim()] : [],
      isCustom: true,
    };

    const updated = saveCustomPdfEntry(scopeKey, entry);
    setCustomEntries(updated);
    setSelectedId(entry.id);
    setNewName('');
    setNewTopic('');
    setShowAddForm(false);
  }

  function handleRemoveCustom(id: string) {
    const updated = removeCustomPdfEntry(scopeKey, id);
    setCustomEntries(updated);
  }

  return (
    <section className="card-shadow overflow-hidden rounded-xl bg-white">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center gap-3 bg-gradient-to-r from-primary/5 to-accent/5 px-4 py-4 text-left transition hover:from-primary/10 hover:to-accent/10 sm:px-5"
        aria-expanded={isOpen}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
          <FileText className="h-5 w-5 text-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-primary">{title}</h3>
          <p className="text-xs text-gray-500">
            {isOpen
              ? 'Details and topics • all dates and all'
              : `Tap to open • ${allEntries.length} PDF report${allEntries.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-gray-100"
          >
            <div className="space-y-4 p-4 sm:p-5">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddForm((v) => !v)}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white hover:bg-accent/90 sm:text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Add More
                </button>
              </div>

              <AnimatePresence>
                {showAddForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl border border-dashed border-accent/30 bg-accent/5 p-4">
                      <p className="mb-3 text-sm font-medium text-primary">Add PDF Report Name</p>
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder="PDF name (required)"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                        <input
                          type="text"
                          value={newTopic}
                          onChange={(e) => setNewTopic(e.target.value)}
                          placeholder="Topic (optional)"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={handleAdd}
                          disabled={!newName.trim()}
                          className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-light disabled:opacity-50 sm:text-sm"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddForm(false);
                            setNewName('');
                            setNewTopic('');
                          }}
                          className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 sm:text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {allEntries.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-400">
                  No PDF reports yet. Click Add More.
                </p>
              ) : (
                <>
                  <div>
                    <label
                      htmlFor="pdf-entry-select"
                      className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400"
                    >
                      Select PDF report
                    </label>
                    <div className="relative">
                      <select
                        id="pdf-entry-select"
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-4 pr-10 text-sm font-medium text-gray-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      >
                        {allEntries.map((entry) => (
                          <option key={entry.id} value={entry.id}>
                            {entry.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>

                  {selectedEntry && (
                    <motion.div
                      key={selectedEntry.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 sm:p-5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900">{selectedEntry.name}</p>
                          {selectedEntry.description && (
                            <p className="mt-1 text-xs text-gray-500">{selectedEntry.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Topics by date
                        </p>
                        {selectedEntry.topics.length > 0 ? (
                          <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                            {selectedEntry.topics.map((topic) => (
                              <li key={topic} className="text-sm text-gray-700">
                                • {topic}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-xs text-gray-400">No topics recorded</p>
                        )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onExport(selectedEntry)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-light sm:text-sm"
                        >
                          <FileDown className="h-4 w-4" />
                          Export PDF
                        </button>
                        {selectedEntry.isCustom && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCustom(selectedEntry.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 sm:text-sm"
                          >
                            <X className="h-3.5 w-3.5" />
                            Remove
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
