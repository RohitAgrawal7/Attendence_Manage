import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Table2 } from 'lucide-react';
import type { SundaySession } from '../../types';
import { formatDate, formatDay, monthName } from '../../utils/formatters';
import { sessionLabel } from '../../utils/sundayHelpers';
import { sessionToTableRows } from '../../utils/studentTable';
import { StudentAttendanceTable } from './StudentAttendanceTable';

interface StudentDataTablesPanelProps {
  sessions: SundaySession[];
  title?: string;
  groupByMonth?: boolean;
  defaultOpen?: boolean;
}

export function StudentDataTablesPanel({
  sessions,
  title = 'All Student Data',
  groupByMonth = false,
  defaultOpen = false,
}: StudentDataTablesPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const sorted = [...sessions].sort((a, b) => a.date.getTime() - b.date.getTime());
  const totalStudents = sorted.reduce((sum, s) => sum + s.attendance.length, 0);

  const grouped = groupByMonth
    ? sorted.reduce<Record<string, SundaySession[]>>((acc, session) => {
        const key = `${session.date.getFullYear()}-${session.date.getMonth() + 1}`;
        acc[key] = acc[key] ?? [];
        acc[key].push(session);
        return acc;
      }, {})
    : null;

  return (
    <section className="card-shadow overflow-hidden rounded-xl bg-white">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center gap-3 bg-gradient-to-r from-primary/5 to-accent/5 px-4 py-4 text-left transition hover:from-primary/10 hover:to-accent/10 sm:px-5"
        aria-expanded={isOpen}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
          <Table2 className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-primary">{title}</h3>
          <p className="text-xs text-gray-500">
            {isOpen
              ? 'Name • Class • Phone • Age • Address • Status for every session'
              : `Tap to open • ${sorted.length} session(s) • ${totalStudents} student record(s)`}
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
            <div className="space-y-5 p-4 sm:p-5">
              {sorted.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">No session data yet</p>
              ) : grouped ? (
                Object.entries(grouped)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([key, monthSessions]) => {
                    const [yearStr, monthStr] = key.split('-');
                    const mLabel = monthName(Number(monthStr));
                    return (
                      <div key={key} className="space-y-4">
                        <p className="text-sm font-bold text-primary">
                          {mLabel} {yearStr}
                        </p>
                        {monthSessions.map((session) => (
                          <SessionTableBlock key={session.date.toISOString()} session={session} />
                        ))}
                      </div>
                    );
                  })
              ) : (
                sorted.map((session) => (
                  <SessionTableBlock key={session.date.toISOString()} session={session} />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function SessionTableBlock({ session }: { session: SundaySession }) {
  const label = sessionLabel(session.date);
  const rows = sessionToTableRows(session);

  return (
    <StudentAttendanceTable
      rows={rows}
      title={`${label} — ${formatDay(session.date)}, ${formatDate(session.date)}`}
      subtitle={
        session.topic
          ? `Topic: ${session.topic} • ${rows.length} students`
          : `${rows.length} students`
      }
    />
  );
}
