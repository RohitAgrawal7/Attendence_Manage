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
  FileDown,
  Eye,
  Trash2,
  Filter,
  X,
} from 'lucide-react';
import type { Student } from '../types';
import { useData } from '../context/DataContext';
import { Header } from '../components/layout/Header';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { PageTransition } from '../components/animations/PageTransition';
import { StudentEditModal } from '../components/forms/StudentEditModal';
import { buildStudentListEntries } from '../utils/studentList';
import { pdfService } from '../services/pdfService';
import { buildStudentReport } from '../utils/studentReport';
import { usePdfPreview } from '../hooks/usePdfPreview';

type FilterCategory = 'all' | 'name' | 'class' | 'phone' | 'age' | 'address';

const FILTER_OPTIONS: { value: FilterCategory; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'name', label: 'Name' },
  { value: 'class', label: 'Class' },
  { value: 'phone', label: 'Phone No.' },
  { value: 'age', label: 'Age' },
  { value: 'address', label: 'Address' },
];

export function StudentsPage() {
  const { students, years, deleteStudent } = useData();
  const { openPreview, previewModal } = usePdfPreview();
  const [query, setQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [classFilter, setClassFilter] = useState('');
  const [ageFilter, setAgeFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const entries = useMemo(() => buildStudentListEntries(students, years), [students, years]);

  const classOptions = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) {
      if (e.student.grade?.trim()) set.add(e.student.grade.trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [entries]);

  const ageOptions = useMemo(() => {
    const set = new Set<number>();
    for (const e of entries) {
      if (e.student.age != null) set.add(e.student.age);
    }
    return [...set].sort((a, b) => a - b);
  }, [entries]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return entries.filter((e) => {
      const s = e.student;

      if (classFilter && (s.grade?.trim() ?? '') !== classFilter) return false;
      if (ageFilter && String(s.age ?? '') !== ageFilter) return false;

      if (!q) return true;

      const name = s.name.toLowerCase();
      const phone = s.phone ?? '';
      const grade = (s.grade ?? '').toLowerCase();
      const address = (s.address ?? '').toLowerCase();
      const age = s.age != null ? String(s.age) : '';

      switch (filterCategory) {
        case 'name':
          return name.includes(q);
        case 'class':
          return grade.includes(q);
        case 'phone':
          return phone.includes(q);
        case 'age':
          return age.includes(q);
        case 'address':
          return address.includes(q);
        default:
          return (
            name.includes(q) ||
            phone.includes(q) ||
            grade.includes(q) ||
            address.includes(q) ||
            age.includes(q) ||
            (s.sanchalanSewa?.toLowerCase().includes(q) ?? false) ||
            (s.stageSewa?.toLowerCase().includes(q) ?? false)
          );
      }
    });
  }, [entries, query, filterCategory, classFilter, ageFilter]);

  const hasActiveFilters = Boolean(query.trim() || classFilter || ageFilter || filterCategory !== 'all');

  function clearFilters() {
    setQuery('');
    setFilterCategory('all');
    setClassFilter('');
    setAgeFilter('');
  }

  function handlePreviewAllSaintsPdf() {
    if (entries.length === 0) {
      alert('No saints data to preview.');
      return;
    }
    openPreview(
      'All Saints Master List',
      () => pdfService.getAllSaintsListBlobUrl(entries),
      () => pdfService.exportAllSaintsList(entries),
    );
  }

  function handleDownloadAllSaintsPdf() {
    if (entries.length === 0) {
      alert('No saints data to download.');
      return;
    }
    pdfService.exportAllSaintsList(entries);
  }

  async function handleDelete(student: Student) {
    const confirmed = window.confirm(
      `Delete "${student.name}"?\n\nThis will permanently remove this saint and all of their attendance records.`,
    );
    if (!confirmed) return;

    setDeletingId(student.id);
    const ok = await deleteStudent(student.id);
    setDeletingId(null);
    if (!ok) {
      alert('Failed to delete student. Please try again.');
      return;
    }
    if (expandedId === student.id) setExpandedId(null);
    if (editingStudent?.id === student.id) setEditingStudent(null);
  }

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
                All saints from start to end — edit, delete, and filter by any category.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handlePreviewAllSaintsPdf}
                className="flex items-center gap-1.5 rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/25"
              >
                <Eye className="h-4 w-4" /> Preview PDF
              </button>
              <button
                type="button"
                onClick={handleDownloadAllSaintsPdf}
                className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-primary hover:bg-white/90"
              >
                <FileDown className="h-4 w-4" /> Download PDF
              </button>
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

        <div className="card-shadow rounded-xl border border-accent/15 bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-primary">All Saints PDF Report</p>
              <p className="mt-0.5 text-sm text-gray-500">
                Includes every saint with: name, class, phone, age, address, sessions, and present count.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handlePreviewAllSaintsPdf}
                className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-white px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/5"
              >
                <Eye className="h-3.5 w-3.5" /> Preview
              </button>
              <button
                type="button"
                onClick={handleDownloadAllSaintsPdf}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-light"
              >
                <FileDown className="h-3.5 w-3.5" /> Download
              </button>
            </div>
          </div>
        </div>

        <div className="card-shadow space-y-3 rounded-xl bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-primary">
              <Filter className="h-4 w-4" /> Filter Saints
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-error"
              >
                <X className="h-3.5 w-3.5" /> Clear filters
              </button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as FilterCategory)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              >
                {FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <label className="mb-1 block text-xs font-medium text-gray-600">Search</label>
              <Search className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  filterCategory === 'all'
                    ? 'Search by name, phone, class, age, address...'
                    : `Search by ${FILTER_OPTIONS.find((o) => o.value === filterCategory)?.label.toLowerCase()}...`
                }
                className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Class filter</label>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              >
                <option value="">All classes</option>
                {classOptions.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Age filter</label>
              <select
                value={ageFilter}
                onChange={(e) => setAgeFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              >
                <option value="">All ages</option>
                {ageOptions.map((age) => (
                  <option key={age} value={String(age)}>
                    {age}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-500">
          Showing <strong>{filtered.length}</strong> of <strong>{entries.length}</strong> unique students
        </p>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center">
            <Users className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-gray-500">No students found</p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-2 text-sm font-medium text-accent hover:underline"
              >
                Clear filters
              </button>
            ) : (
              <Link to="/#attendance-form" className="mt-2 inline-block text-sm font-medium text-accent hover:underline">
                Add first student from form
              </Link>
            )}
          </div>
        ) : (
          <div className="card-shadow overflow-hidden rounded-xl bg-white">
            <div className="hidden border-b border-gray-100 bg-gray-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:grid sm:grid-cols-[1fr_100px_80px_80px_60px_90px] sm:gap-2">
              <span>Student</span>
              <span>Class</span>
              <span>Present</span>
              <span>Sessions</span>
              <span>Rate</span>
              <span>Actions</span>
            </div>
            <div className="divide-y divide-gray-100">
              {filtered.map((entry) => {
                const { student } = entry;
                const isOpen = expandedId === student.id;
                const isDeleting = deletingId === student.id;

                return (
                  <div key={student.id}>
                    <div
                      className={`flex w-full items-center gap-2 px-4 py-3.5 text-left transition sm:grid sm:grid-cols-[1fr_100px_80px_80px_60px_90px] sm:gap-2 ${isOpen ? 'bg-accent/5' : 'hover:bg-gray-50'}`}
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedId(isOpen ? null : student.id)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left sm:contents"
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
                      </button>

                      <div className="flex shrink-0 items-center gap-1 sm:justify-self-end">
                        <button
                          type="button"
                          onClick={() => setEditingStudent(student)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent hover:bg-accent/20"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(student)}
                          disabled={isDeleting}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-error/10 text-error hover:bg-error/20 disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpandedId(isOpen ? null : student.id)}
                          className="flex h-8 w-8 items-center justify-center text-gray-400"
                        >
                          <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                            <ChevronDown className="h-4 w-4" />
                          </motion.div>
                        </button>
                      </div>
                    </div>

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
                                {student.gender && (
                                  <p className="text-gray-600">
                                    Gender: {student.gender === 'boy' ? 'Boy' : 'Girl'}
                                  </p>
                                )}
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
                              <button
                                type="button"
                                onClick={() => setEditingStudent(student)}
                                className="flex items-center gap-1.5 rounded-lg border border-accent/30 bg-white px-3 py-2 text-xs font-semibold text-accent hover:bg-accent/5"
                              >
                                <Pencil className="h-3.5 w-3.5" /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(student)}
                                disabled={isDeleting}
                                className="flex items-center gap-1.5 rounded-lg border border-error/30 bg-white px-3 py-2 text-xs font-semibold text-error hover:bg-error/5 disabled:opacity-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> {isDeleting ? 'Deleting…' : 'Delete'}
                              </button>
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
                                  openPreview(
                                    `${student.name} — All Time`,
                                    () => pdfService.getStudentReportBlobUrl(report),
                                    () => pdfService.exportStudentReport(report),
                                  );
                                }}
                                className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-white px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/5"
                              >
                                <Eye className="h-3.5 w-3.5" /> Preview PDF
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const report = buildStudentReport(student, years, { type: 'all' }, 'All Time');
                                  pdfService.exportStudentReport(report);
                                }}
                                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-light"
                              >
                                <CalendarCheck className="h-3.5 w-3.5" /> Download PDF
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

      <StudentEditModal student={editingStudent} onClose={() => setEditingStudent(null)} />

      {previewModal}
    </PageTransition>
  );
}
