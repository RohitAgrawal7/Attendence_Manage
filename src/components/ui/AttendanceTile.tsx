import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Radio, ChevronDown, Check } from 'lucide-react';
import { ATTENDANCE_STATUS_MAP, type AttendanceRecord, type AttendanceStatus, type PatchAttendanceInput } from '../../types';
import { useData } from '../../context/DataContext';
import { statusColor } from '../../utils/stats';

const STATUS_OPTIONS: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];

const GRADE_OPTIONS = [
  '', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
  'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
  'Grade 11', 'Grade 12',
];

interface AttendanceTileProps {
  record: AttendanceRecord;
  year: number;
  month: number;
  date: Date;
  isOpen: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onViewReport?: () => void;
}

function OneLineDetail({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-xs text-gray-500">
      <span className="text-gray-300">•</span>
      <span className="text-[10px] uppercase tracking-wide text-gray-400">{label}</span>
      <span className="max-w-[88px] truncate font-medium text-gray-600 sm:max-w-[120px]">{value}</span>
    </span>
  );
}

export function AttendanceTile({
  record,
  year,
  month,
  date,
  isOpen,
  onToggle,
  onDelete,
  onViewReport,
}: AttendanceTileProps) {
  const { patchAttendance } = useData();
  const [name, setName] = useState(record.student.name);
  const [phone, setPhone] = useState(record.student.phone ?? '');
  const [address, setAddress] = useState(record.student.address ?? '');
  const [grade, setGrade] = useState(record.student.grade ?? '');
  const [sanchalanSewa, setSanchalanSewa] = useState(record.student.sanchalanSewa ?? '');
  const [stageSewa, setStageSewa] = useState(record.student.stageSewa ?? '');
  const [age, setAge] = useState(record.student.age != null ? String(record.student.age) : '');
  const [status, setStatus] = useState(record.status);
  const [liveSaved, setLiveSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const info = ATTENDANCE_STATUS_MAP[status];
  const color = statusColor(status);
  const { student } = record;

  useEffect(() => {
    setName(record.student.name);
    setPhone(record.student.phone ?? '');
    setAddress(record.student.address ?? '');
    setGrade(record.student.grade ?? '');
    setSanchalanSewa(record.student.sanchalanSewa ?? '');
    setStageSewa(record.student.stageSewa ?? '');
    setAge(record.student.age != null ? String(record.student.age) : '');
    setStatus(record.status);
  }, [record]);

  function flashLive() {
    setLiveSaved(true);
    setTimeout(() => setLiveSaved(false), 1200);
  }

  function livePatch(patch: PatchAttendanceInput['patch']) {
    patchAttendance({ studentId: student.id, year, month, date, patch });
    flashLive();
  }

  function debouncedPatch(patch: PatchAttendanceInput['patch']) {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => livePatch(patch), 350);
  }

  return (
    <div className={`transition-colors ${isOpen ? 'bg-accent/5' : 'bg-white hover:bg-gray-50'}`}>
      {/* One-line row */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-3 py-3 text-left sm:gap-3 sm:px-4"
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {info.shortCode}
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto sm:gap-2">
          <span className="shrink-0 font-semibold text-gray-900">{student.name}</span>
          <OneLineDetail label="Class" value={student.grade} />
          <OneLineDetail label="Phone" value={student.phone} />
          <OneLineDetail label="Sanchalan" value={student.sanchalanSewa} />
          <OneLineDetail label="Stage" value={student.stageSewa} />
          <OneLineDetail label="Addr" value={student.address} />
          {student.age != null && (
            <span className="inline-flex shrink-0 items-center gap-1 text-xs text-gray-500">
              <span className="text-gray-300">•</span>
              <span className="text-[10px] uppercase tracking-wide text-gray-400">Age</span>
              <span className="font-medium text-gray-600">{student.age}</span>
            </span>
          )}
        </div>

        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:px-2.5 sm:text-xs"
          style={{ backgroundColor: `${color}18`, color }}
        >
          {info.label}
        </span>

        {liveSaved && (
          <Radio className="h-3.5 w-3.5 shrink-0 animate-pulse text-success" />
        )}

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-gray-400"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </button>

      {/* Edit dropdown */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-accent/20 bg-white px-3 pb-4 pt-3 sm:px-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">
                Edit Student Details
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-[10px] font-medium text-gray-500">Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      debouncedPatch({ name: e.target.value });
                    }}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-gray-500">Phone (optional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      debouncedPatch({ phone: e.target.value });
                    }}
                    placeholder="Mobile number"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-gray-500">Class (optional)</label>
                  <select
                    value={grade}
                    onChange={(e) => {
                      setGrade(e.target.value);
                      livePatch({ grade: e.target.value });
                    }}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="">Select class</option>
                    {GRADE_OPTIONS.filter(Boolean).map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-[10px] font-medium text-gray-500">Address (optional)</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      debouncedPatch({ address: e.target.value });
                    }}
                    placeholder="Address"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-gray-500">Sanchalan Sewa (optional)</label>
                  <input
                    type="text"
                    value={sanchalanSewa}
                    onChange={(e) => {
                      setSanchalanSewa(e.target.value);
                      debouncedPatch({ sanchalanSewa: e.target.value });
                    }}
                    placeholder="Sanchalan sewa"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-gray-500">Stage Sewa (optional)</label>
                  <input
                    type="text"
                    value={stageSewa}
                    onChange={(e) => {
                      setStageSewa(e.target.value);
                      debouncedPatch({ stageSewa: e.target.value });
                    }}
                    placeholder="Stage sewa"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-gray-500">Age (optional)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={age}
                    onChange={(e) => {
                      setAge(e.target.value);
                      const n = Number(e.target.value);
                      debouncedPatch({ age: e.target.value ? (isNaN(n) ? undefined : n) : undefined });
                    }}
                    placeholder="Age"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-gray-500">Status (optional)</label>
                  <select
                    value={status}
                    onChange={(e) => {
                      const v = e.target.value as AttendanceStatus;
                      setStatus(v);
                      livePatch({ status: v });
                    }}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{ATTENDANCE_STATUS_MAP[s].label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {onViewReport && (
                  <button
                    type="button"
                    onClick={onViewReport}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 py-2.5 text-sm font-medium text-accent hover:bg-accent/15"
                  >
                    View Full Report
                  </button>
                )}
                <button
                  type="button"
                  onClick={onToggle}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-light"
                >
                  <Check className="h-4 w-4" /> Done
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-error/30 bg-error/10 px-4 py-2.5 text-sm font-medium text-error hover:bg-error/15"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
