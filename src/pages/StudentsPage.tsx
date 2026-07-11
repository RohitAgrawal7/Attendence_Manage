import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Phone,
  MapPin,
  GraduationCap,
  ChevronDown,
  UserPlus,
  CalendarCheck,
  Pencil,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Header } from '../components/layout/Header';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { PageTransition } from '../components/animations/PageTransition';
import { buildStudentListEntries } from '../utils/studentList';
import { pdfService } from '../services/pdfService';
import { buildStudentReport } from '../utils/studentReport';

export function StudentsPage() {
  const { students, years } = useData();
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const entries = useMemo(() => buildStudentListEntries(students, years), [students, years]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.student.name.toLowerCase().includes(q) ||
        e.student.phone?.includes(q) ||
        e.student.grade?.toLowerCase().includes(q) ||
        e.student.address?.toLowerCase().includes(q),
    );
  }, [entries, query]);

  return (
    <PageTransition>
      <Header title="All Saints" />
      <Breadcrumb items={[{ label: 'All Students' }]} />

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <div className="gradient-primary rounded-xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-white sm:text-2xl">
                <Users className="h-6 w-6" />
                Master Saints List
              </h2>
              <p className="mt-1 text-sm text-white/80">
                All saints from start to end — auto-updates when you add from the form. No duplicates.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/#attendance-form"
                className="flex items-center gap-1.5 rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/25"
              >
                <UserPlus className="h-4 w-4" /> Add Student
              </Link>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Total Students', value: entries.length },
              { label: 'With Attendance', value: entries.filter((e) => e.totalSessions > 0).length },
              { label: 'Total Sessions', value: entries.reduce((s, e) => s + e.totalSessions, 0) },
              { label: 'Avg Rate', value: entries.length ? `${(entries.reduce((s, e) => s + e.rate, 0) / entries.length).toFixed(0)}%` : '0%' },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg bg-white/10 px-3 py-2 text-center">
                <p className="text-lg font-bold text-white">{value}</p>
                <p className="text-[10px] text-white/70 sm:text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, phone, class, address..."
            className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <p className="text-sm text-gray-500">
          Showing <strong>{filtered.length}</strong> of <strong>{entries.length}</strong> unique students
        </p>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center">
            <Users className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-gray-500">No students found</p>
            <Link to="/#attendance-form" className="mt-2 inline-block text-sm font-medium text-accent hover:underline">
              Add first student from form
            </Link>
          </div>
        ) : (
          <div className="card-shadow overflow-hidden rounded-xl bg-white">
            <div className="hidden border-b border-gray-100 bg-gray-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:grid sm:grid-cols-[1fr_100px_80px_80px_60px] sm:gap-2">
              <span>Student</span>
              <span>Class</span>
              <span>Present</span>
              <span>Sessions</span>
              <span>Rate</span>
            </div>
            <div className="divide-y divide-gray-100">
              {filtered.map((entry) => {
                const { student } = entry;
                const isOpen = expandedId === student.id;

                return (
                  <div key={student.id}>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isOpen ? null : student.id)}
                      className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition sm:grid sm:grid-cols-[1fr_100px_80px_80px_60px] sm:gap-2 ${isOpen ? 'bg-accent/5' : 'hover:bg-gray-50'}`}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {student.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900">{student.name}</p>
                          <p className="truncate text-xs text-gray-500 sm:hidden">
                            {student.grade ?? '—'} • {entry.present}/{entry.totalSessions} present
                          </p>
                        </div>
                      </div>
                      <span className="hidden truncate text-sm text-gray-600 sm:block">{student.grade ?? '—'}</span>
                      <span className="hidden text-sm font-semibold text-success sm:block">{entry.present}</span>
                      <span className="hidden text-sm text-gray-600 sm:block">{entry.totalSessions}</span>
                      <span className="hidden text-sm font-medium text-primary sm:block">{entry.rate.toFixed(0)}%</span>
                      <motion.div animate={{ rotate: isOpen ? 180 : 0 }} className="shrink-0 text-gray-400 sm:col-span-1 sm:justify-self-end">
                        <ChevronDown className="h-4 w-4" />
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-accent/15 bg-gray-50/50 px-4 py-4 sm:px-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2 text-sm">
                                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Contact & Details</p>
                                {student.grade && (
                                  <p className="flex items-center gap-2 text-gray-600">
                                    <GraduationCap className="h-4 w-4 text-gray-400" /> {student.grade}
                                  </p>
                                )}
                                {student.phone && (
                                  <p className="flex items-center gap-2 text-gray-600">
                                    <Phone className="h-4 w-4 text-gray-400" /> {student.phone}
                                  </p>
                                )}
                                {student.address && (
                                  <p className="flex items-center gap-2 text-gray-600">
                                    <MapPin className="h-4 w-4 text-gray-400" /> {student.address}
                                  </p>
                                )}
                                {student.age != null && <p className="text-gray-600">Age: {student.age}</p>}
                                {student.rollNumber && <p className="text-gray-600">Roll: {student.rollNumber}</p>}
                                {student.sanchalanSewa && (
                                  <p className="text-gray-600">Sanchalan Sewa: {student.sanchalanSewa}</p>
                                )}
                                {student.stageSewa && (
                                  <p className="text-gray-600">Stage Sewa: {student.stageSewa}</p>
                                )}
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Attendance Summary</p>
                                <div className="grid grid-cols-3 gap-2">
                                  {[
                                    { label: 'Present', value: entry.present, color: '#2e7d32' },
                                    { label: 'Absent', value: entry.absent, color: '#c62828' },
                                    { label: 'Late', value: entry.late, color: '#f57c00' },
                                    { label: 'Excused', value: entry.excused, color: '#4a90d9' },
                                    { label: 'Came', value: entry.cameDays, color: '#2e7d32' },
                                    { label: 'Rate', value: `${entry.rate.toFixed(0)}%`, color: '#1e3a5f' },
                                  ].map(({ label, value, color }) => (
                                    <div key={label} className="rounded-lg bg-white p-2 text-center shadow-sm">
                                      <p className="text-sm font-bold" style={{ color }}>{value}</p>
                                      <p className="text-[10px] text-gray-500">{label}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <Link
                                to="/#attendance-form"
                                className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-white px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/5"
                              >
                                <Pencil className="h-3.5 w-3.5" /> Add Attendance
                              </Link>
                              <button
                                type="button"
                                onClick={() => {
                                  const report = buildStudentReport(student, years, { type: 'all' }, 'All Time');
                                  pdfService.exportStudentReport(report);
                                }}
                                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-light"
                              >
                                <CalendarCheck className="h-3.5 w-3.5" /> Export PDF
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
