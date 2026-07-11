import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Search,
  Phone,
  MapPin,
  GraduationCap,
  CalendarCheck,
  Share2,
  FileDown,
  ChevronDown,
} from 'lucide-react';
import type { Student } from '../../types';
import { ATTENDANCE_STATUS_MAP } from '../../types';
import { useData } from '../../context/DataContext';
import { pdfService } from '../../services/pdfService';
import {
  buildStudentReport,
  formatStudentReportText,
  type ReportScope,
} from '../../utils/studentReport';
import { statusColor } from '../../utils/stats';
import { formatDate, formatDay } from '../../utils/formatters';

interface StudentReportPanelProps {
  scope: ReportScope;
  scopeLabel: string;
  initialStudentId?: string;
  compact?: boolean;
}

export function StudentReportPanel({
  scope,
  scopeLabel,
  initialStudentId,
  compact,
}: StudentReportPanelProps) {
  const { students, years } = useData();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | undefined>(initialStudentId);
  const [open, setOpen] = useState(!compact || Boolean(initialStudentId));
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initialStudentId) return;
    const student = students.find((s) => s.id === initialStudentId);
    if (student) {
      setSelectedId(student.id);
      setQuery(student.name);
      setOpen(true);
    }
  }, [initialStudentId, students]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students.slice(0, 8);
    return students.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 8);
  }, [students, query]);

  const selectedStudent = students.find((s) => s.id === selectedId);

  const report = useMemo(() => {
    if (!selectedStudent) return null;
    return buildStudentReport(selectedStudent, years, scope, scopeLabel);
  }, [selectedStudent, years, scope, scopeLabel]);

  function selectStudent(student: Student) {
    setSelectedId(student.id);
    setQuery(student.name);
    setOpen(true);
    setShowSuggestions(false);
  }

  const showDropdown = showSuggestions && query.trim().length > 0 && !selectedId && suggestions.length > 0;

  async function handleShare() {
    if (!report) return;
    const text = formatStudentReportText(report);
    const title = `${report.student.name} — ${scopeLabel}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text });
        return;
      } catch {
        // fall through to clipboard
      }
    }

    await navigator.clipboard.writeText(text);
    alert('Report copied to clipboard. You can paste and share it anywhere.');
  }

  function handleExportPdf() {
    if (!report) return;
    pdfService.exportStudentReport(report);
  }

  return (
    <div className="card-shadow relative z-10 rounded-xl bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 bg-primary/5 px-4 py-3 text-left sm:px-5"
      >
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <div>
            <p className="font-bold text-primary">Saints Report — {scopeLabel}</p>
            <p className="text-xs text-gray-500">Search any saints • days present • full details • share</p>
          </div>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }}>
          <ChevronDown className="h-5 w-5 text-gray-400" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-visible"
          >
            <div className="space-y-4 border-t border-gray-100 p-4 sm:p-5">
              <div ref={searchRef} className="relative z-30">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedId(undefined);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Type saints name e.g. Aarav..."
                  autoComplete="off"
                  className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                {showDropdown && (
                  <ul className="mt-1 max-h-56 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-xl ring-1 ring-black/5">
                    {suggestions.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectStudent(s)}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-accent/10"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {s.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">{s.name}</p>
                            <p className="truncate text-xs text-gray-500">
                              {s.grade ?? 'No class'} • {s.phone ?? 'No phone'}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {report && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h4 className="text-lg font-bold text-primary">{report.student.name}</h4>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 sm:text-sm">
                          {report.student.grade && (
                            <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> {report.student.grade}</span>
                          )}
                          {report.student.phone && (
                            <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {report.student.phone}</span>
                          )}
                          {report.student.address && (
                            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {report.student.address}</span>
                          )}
                          {report.student.sanchalanSewa && (
                            <span>Sanchalan Sewa: {report.student.sanchalanSewa}</span>
                          )}
                          {report.student.stageSewa && (
                            <span>Stage Sewa: {report.student.stageSewa}</span>
                          )}
                          {report.student.age != null && <span>Age: {report.student.age}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleShare}
                          className="flex items-center gap-1.5 rounded-lg border border-accent/30 bg-white px-3 py-2 text-xs font-semibold text-accent hover:bg-accent/5"
                        >
                          <Share2 className="h-3.5 w-3.5" /> Share
                        </button>
                        <button
                          type="button"
                          onClick={handleExportPdf}
                          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-light"
                        >
                          <FileDown className="h-3.5 w-3.5" /> PDF
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                    {[
                      { label: 'Sessions', value: report.totalDays, color: '#1e3a5f' },
                      { label: 'Present', value: report.present, color: '#2e7d32' },
                      { label: 'Came', value: report.cameDays, color: '#2e7d32' },
                      { label: 'Absent', value: report.absent, color: '#c62828' },
                      { label: 'Late', value: report.late, color: '#f57c00' },
                      { label: 'Excused', value: report.excused, color: '#4a90d9' },
                      { label: 'Rate', value: `${report.rate.toFixed(0)}%`, color: '#1e3a5f' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="rounded-lg bg-gray-50 p-3 text-center">
                        <p className="text-lg font-bold" style={{ color }}>{value}</p>
                        <p className="text-[10px] text-gray-500 sm:text-xs">{label}</p>
                      </div>
                    ))}
                  </div>

                  {report.days.length === 0 ? (
                    <p className="py-4 text-center text-sm text-gray-500">No attendance records in this period</p>
                  ) : (
                    <div>
                      <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-primary">
                        <CalendarCheck className="h-4 w-4" /> Day-by-Day Attendance
                      </p>
                      <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="w-full min-w-[480px] text-left text-sm">
                          <thead className="bg-primary/5 text-xs uppercase text-gray-500">
                            <tr>
                              <th className="px-3 py-2">#</th>
                              <th className="px-3 py-2">Date</th>
                              <th className="px-3 py-2">Session</th>
                              <th className="px-3 py-2">Topic</th>
                              <th className="px-3 py-2">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.days.map((day, i) => {
                              const color = statusColor(day.status);
                              return (
                                <tr key={day.date.getTime()} className="border-t border-gray-100">
                                  <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    {formatDay(day.date)}, {formatDate(day.date)}
                                  </td>
                                  <td className="px-3 py-2 font-medium">{day.label}</td>
                                  <td className="max-w-[140px] truncate px-3 py-2 text-xs text-accent">
                                    {day.topic ?? '—'}
                                  </td>
                                  <td className="px-3 py-2">
                                    <span
                                      className="rounded-full px-2 py-0.5 text-xs font-semibold"
                                      style={{ backgroundColor: `${color}18`, color }}
                                    >
                                      {ATTENDANCE_STATUS_MAP[day.status].label}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {!selectedStudent && query.trim() && !showDropdown && suggestions.length === 0 && (
                <p className="text-center text-sm text-gray-500">No students found</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
