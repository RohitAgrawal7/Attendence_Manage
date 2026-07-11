import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { UserPlus, Pencil, CheckCircle2, CalendarDays, Trash2, X, Radio, BookOpen } from 'lucide-react';
import type { AttendanceStatus, Student } from '../../types';
import { ATTENDANCE_STATUS_MAP } from '../../types';
import { useData } from '../../context/DataContext';
import { DateCalendar } from './DateCalendar';
import { StudentNameField, studentToFormFields } from './StudentNameField';
import { sessionLabel, toDateKey } from '../../utils/sundayHelpers';
import { formatDate, monthName } from '../../utils/formatters';

const STATUS_OPTIONS: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];

const GRADE_OPTIONS = [
  '', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
  'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
  'Grade 11', 'Grade 12',
];

interface FormState {
  studentId?: string;
  name: string;
  phone: string;
  address: string;
  age: string;
  grade: string;
  sanchalanSewa: string;
  stageSewa: string;
  status: AttendanceStatus;
}

const emptyForm: FormState = {
  name: '',
  phone: '',
  address: '',
  age: '',
  grade: '',
  sanchalanSewa: '',
  stageSewa: '',
  status: 'present',
};

export function AttendanceForm() {
  const { students, saveAttendance, patchAttendance, deleteAttendance, updateSessionTopic, editTarget, setEditTarget, getSessionByDate } = useData();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [topic, setTopic] = useState('');
  const [form, setForm] = useState<FormState>(emptyForm);
  const [liveSaved, setLiveSaved] = useState(false);
  const [success, setSuccess] = useState<{
    year: number;
    month: number;
    dateKey: string;
    studentName: string;
    isUpdate: boolean;
  } | null>(null);
  const [error, setError] = useState('');
  const hydratingRef = useRef(false);
  const liveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const topicHydratingRef = useRef(true);
  const topicTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const autoFillTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const mName = monthName(selectedDate.getMonth() + 1);
  const label = sessionLabel(selectedDate);

  function getSessionRecord(studentId: string) {
    const session = getSessionByDate(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      selectedDate,
    );
    return session?.attendance.find((a) => a.student.id === studentId);
  }

  const isInSession = Boolean(form.studentId && getSessionRecord(form.studentId));
  const isEditing = isInSession;

  useEffect(() => {
    topicHydratingRef.current = true;
    const session = getSessionByDate(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      selectedDate,
    );
    setTopic(session?.topic ?? '');
    const t = setTimeout(() => {
      topicHydratingRef.current = false;
    }, 50);
    return () => clearTimeout(t);
    // Only reload topic when date changes, not on every data update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toDateKey(selectedDate)]);

  useEffect(() => {
    if (!editTarget) return;
    hydratingRef.current = true;
    setSelectedDate(new Date(editTarget.date));
    const session = getSessionByDate(editTarget.year, editTarget.month, editTarget.date);
    const record = session?.attendance.find((a) => a.student.id === editTarget.studentId);
    if (record) {
      setForm({
        studentId: record.student.id,
        name: record.student.name,
        phone: record.student.phone ?? '',
        address: record.student.address ?? '',
        age: record.student.age != null ? String(record.student.age) : '',
        grade: record.student.grade ?? '',
        sanchalanSewa: record.student.sanchalanSewa ?? '',
        stageSewa: record.student.stageSewa ?? '',
        status: record.status,
      });
      setError('');
      setSuccess(null);
    }
    setTimeout(() => { hydratingRef.current = false; }, 50);
  }, [editTarget, getSessionByDate]);

  // Real-time patch when editing a student already in this session
  useEffect(() => {
    if (!form.studentId || hydratingRef.current || !isInSession) return;

    clearTimeout(liveTimerRef.current);
    liveTimerRef.current = setTimeout(() => {
      patchAttendance({
        studentId: form.studentId!,
        year: selectedDate.getFullYear(),
        month: selectedDate.getMonth() + 1,
        date: selectedDate,
        patch: {
          phone: form.phone,
          address: form.address,
          grade: form.grade,
          sanchalanSewa: form.sanchalanSewa,
          stageSewa: form.stageSewa,
          status: form.status,
        },
      });
      setLiveSaved(true);
      setTimeout(() => setLiveSaved(false), 1500);
    }, 350);

    return () => clearTimeout(liveTimerRef.current);
  }, [form.phone, form.address, form.grade, form.sanchalanSewa, form.stageSewa, form.status, form.studentId, selectedDate, patchAttendance, isInSession]);

  useEffect(() => {
    if (topicHydratingRef.current) return;

    clearTimeout(topicTimerRef.current);
    topicTimerRef.current = setTimeout(() => {
      updateSessionTopic({
        year: selectedDate.getFullYear(),
        month: selectedDate.getMonth() + 1,
        date: selectedDate,
        topic,
      });
    }, 400);

    return () => clearTimeout(topicTimerRef.current);
  }, [topic, selectedDate, updateSessionTopic]);

  function resetForm() {
    setForm(emptyForm);
    setEditTarget(null);
    setError('');
    setLiveSaved(false);
  }

  function applyStudent(student: Student) {
    hydratingRef.current = true;
    const record = getSessionRecord(student.id);
    setForm(studentToFormFields(student, record?.status ?? 'present'));
    setError('');
    setTimeout(() => { hydratingRef.current = false; }, 50);
  }

  function handleNameChange(name: string) {
    setForm((prev) => ({ ...prev, name, studentId: undefined }));
    setError('');

    clearTimeout(autoFillTimerRef.current);
    if (!name.trim()) return;

    autoFillTimerRef.current = setTimeout(() => {
      const exact = students.find(
        (s) => s.name.toLowerCase() === name.trim().toLowerCase(),
      );
      if (exact) applyStudent(exact);
    }, 450);
  }

  function handleClearStudent() {
    setForm((prev) => ({
      ...prev,
      studentId: undefined,
      phone: '',
      address: '',
      age: '',
      grade: '',
      sanchalanSewa: '',
      stageSewa: '',
      status: 'present',
    }));
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
  }

  const profileLoaded = Boolean(form.studentId);
  const filledInputClass = profileLoaded
    ? 'border-success/30 bg-success/5 focus:border-success focus:ring-success/20'
    : 'border-gray-200 focus:border-accent focus:ring-accent/20';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Student name is required');
      return;
    }

    const age = form.age.trim() ? Number(form.age) : undefined;
    if (form.age.trim() && (isNaN(age!) || age! < 1 || age! > 100)) {
      setError('Please enter a valid age');
      return;
    }

    try {
      const result = await saveAttendance({
        studentId: form.studentId,
        name: form.name,
        phone: form.phone || undefined,
        address: form.address || undefined,
        age,
        grade: form.grade || undefined,
        sanchalanSewa: form.sanchalanSewa || undefined,
        stageSewa: form.stageSewa || undefined,
        status: form.status,
        topic: topic || undefined,
        date: selectedDate,
      });

      setSuccess({
        year: result.year,
        month: result.month,
        dateKey: result.dateKey,
        studentName: result.studentName,
        isUpdate: result.isUpdate,
      });
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save attendance');
    }
  }

  async function handleDelete() {
    if (!form.studentId) return;
    if (!confirm(`Delete ${form.name} from ${formatDate(selectedDate)} attendance?`)) return;

    try {
      await deleteAttendance({
        studentId: form.studentId,
        year: selectedDate.getFullYear(),
        month: selectedDate.getMonth() + 1,
        date: selectedDate,
      });
      setSuccess(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete attendance');
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="card-shadow overflow-hidden rounded-2xl bg-white">
        <div className="gradient-primary px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                {isEditing ? <Pencil className="h-5 w-5 text-white" /> : <UserPlus className="h-5 w-5 text-white" />}
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-white sm:text-xl">
                  {isEditing ? 'Edit Attendance' : 'Add Attendance'}
                </h3>
                <p className="text-xs text-white/80 sm:text-sm">
                  {isEditing
                    ? 'Phone, address, class & status update live as you type'
                    : 'Type a name to auto-fill — existing students load instantly'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {liveSaved && (
                <span className="flex items-center gap-1 rounded-lg bg-white/15 px-2 py-1 text-[10px] text-white sm:text-xs">
                  <Radio className="h-3 w-3 animate-pulse" /> Saved live
                </span>
              )}
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center gap-1 rounded-lg bg-white/15 px-3 py-1.5 text-xs text-white hover:bg-white/25"
                >
                  <X className="h-3.5 w-3.5" /> Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 p-5 sm:grid-cols-2 sm:gap-8 sm:p-6">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
              <CalendarDays className="h-4 w-4" />
              Select Date
            </label>
            <DateCalendar selected={selectedDate} onSelect={setSelectedDate} />
            <div className="mt-3 rounded-lg bg-primary/5 px-3 py-2 text-center text-sm">
              <span className="text-gray-500">Recording for: </span>
              <span className="font-bold text-primary">
                {mName} {selectedDate.getFullYear()} → {label}
              </span>
            </div>
            <div className="mt-3">
              <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-600">
                <BookOpen className="h-3.5 w-3.5" />
                Session Topic <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Leadership & Teamwork"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <StudentNameField
              students={students}
              value={form.name}
              studentId={form.studentId}
              onChange={handleNameChange}
              onSelectStudent={applyStudent}
              onClearStudent={handleClearStudent}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Phone <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="9876543210"
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:ring-2 ${filledInputClass}`}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Age <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={form.age}
                  onChange={(e) => updateField('age', e.target.value)}
                  placeholder="16"
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:ring-2 ${filledInputClass}`}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Address <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="City, State"
                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:ring-2 ${filledInputClass}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Class <span className="text-gray-400">(optional)</span>
                </label>
                <select
                  value={form.grade}
                  onChange={(e) => updateField('grade', e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:ring-2 ${filledInputClass}`}
                >
                  <option value="">Select class</option>
                  {GRADE_OPTIONS.filter(Boolean).map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Status <span className="text-gray-400">(optional)</span>
                </label>
                <select
                  value={form.status}
                  onChange={(e) => updateField('status', e.target.value as AttendanceStatus)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:ring-2 ${filledInputClass}`}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{ATTENDANCE_STATUS_MAP[s].label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Sanchalan Sewa <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.sanchalanSewa}
                  onChange={(e) => updateField('sanchalanSewa', e.target.value)}
                  placeholder="e.g. Team A"
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:ring-2 ${filledInputClass}`}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Stage Sewa <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.stageSewa}
                  onChange={(e) => updateField('stageSewa', e.target.value)}
                  placeholder="e.g. Welcome"
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:ring-2 ${filledInputClass}`}
                />
              </div>
            </div>

            {error && <p className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</p>}

            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="gradient-primary flex-1 rounded-xl py-3 text-sm font-semibold text-white shadow-md sm:py-3.5"
              >
                {isEditing ? 'Save Changes' : form.studentId ? `Save ${form.name.split(' ')[0]} → ${label}` : `Save New Student → ${label}`}
              </motion.button>
              {isEditing && (
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center gap-1 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm font-semibold text-error hover:bg-error/15"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Delete</span>
                </motion.button>
              )}
            </div>
          </div>
        </form>

        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gray-100 bg-success/5 px-5 py-4 sm:px-6"
            >
              <div className="flex flex-wrap items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <p className="flex-1 text-sm text-gray-700">
                  <span className="font-semibold text-success">
                    {success.isUpdate ? 'Updated' : 'Added'}
                  </span>{' '}
                  <strong>{success.studentName}</strong>
                </p>
                <Link
                  to={`/year/${success.year}/month/${success.month}/date/${success.dateKey}`}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-light sm:text-sm"
                >
                  View Session
                </Link>
                <button type="button" onClick={() => setSuccess(null)} className="text-xs text-gray-400 hover:text-gray-600">
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
