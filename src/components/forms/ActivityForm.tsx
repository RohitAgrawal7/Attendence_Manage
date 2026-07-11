import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, X } from 'lucide-react';
import type { Activity } from '../../types';
import { useData } from '../../context/DataContext';

const CATEGORY_OPTIONS = ['Assembly', 'Academic', 'Sports', 'Cultural', 'Other'];

interface ActivityFormProps {
  year: number;
  month: number;
  date: Date;
  editing?: Activity | null;
  onDone: () => void;
}

const empty = {
  title: '',
  description: '',
  category: 'Academic',
  duration: '',
};

export function ActivityForm({ year, month, date, editing, onDone }: ActivityFormProps) {
  const { saveActivity } = useData();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title,
        description: editing.description,
        category: editing.category,
        duration: editing.durationMinutes != null ? String(editing.durationMinutes) : '',
      });
    } else {
      setForm(empty);
    }
    setError('');
  }, [editing]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Activity title is required');
      return;
    }

    const duration = form.duration.trim() ? Number(form.duration) : undefined;
    if (form.duration.trim() && (isNaN(duration!) || duration! < 1)) {
      setError('Enter a valid duration');
      return;
    }

    try {
      await saveActivity({
        id: editing?.id,
        title: form.title,
        description: form.description,
        category: form.category,
        durationMinutes: duration,
        year,
        month,
        date,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save activity');
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="card-shadow rounded-xl border border-accent/20 bg-white p-4 sm:p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-sm font-bold text-primary">
          {editing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {editing ? 'Edit Activity' : 'Add Activity'}
        </h4>
        <button type="button" onClick={onDone} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Morning Assembly"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Activity details..."
            rows={2}
            className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Duration (min)</label>
            <input
              type="number"
              min={1}
              value={form.duration}
              onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
              placeholder="30"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>

        {error && <p className="text-sm text-error">{error}</p>}

        <button
          type="submit"
          className="gradient-primary w-full rounded-lg py-2.5 text-sm font-semibold text-white"
        >
          {editing ? 'Update Activity' : 'Add Activity'}
        </button>
      </div>
    </motion.form>
  );
}
