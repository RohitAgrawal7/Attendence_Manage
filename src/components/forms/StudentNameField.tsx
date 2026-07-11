import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserCheck, UserPlus, Phone, MapPin, GraduationCap } from 'lucide-react';
import type { AttendanceStatus, Student } from '../../types';

interface StudentNameFieldProps {
  students: Student[];
  value: string;
  studentId?: string;
  onChange: (name: string) => void;
  onSelectStudent: (student: Student) => void;
  onClearStudent: () => void;
  disabled?: boolean;
}

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.trim().toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-accent/20 px-0.5 font-semibold text-accent">
        {text.slice(idx, idx + query.trim().length)}
      </mark>
      {text.slice(idx + query.trim().length)}
    </>
  );
}

export function StudentNameField({
  students,
  value,
  studentId,
  onChange,
  onSelectStudent,
  onClearStudent,
  disabled,
}: StudentNameFieldProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const query = value.trim();
  const matchedStudent = useMemo(() => {
    if (!query) return undefined;
    return students.find((s) => s.name.toLowerCase() === query.toLowerCase());
  }, [students, query]);

  const suggestions = useMemo(() => {
    if (!query) return students.slice(0, 6);
    const q = query.toLowerCase();
    return students
      .filter((s) => s.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(q) ? 0 : 1;
        const bStarts = b.name.toLowerCase().startsWith(q) ? 0 : 1;
        if (aStarts !== bStarts) return aStarts - bStarts;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 6);
  }, [students, query]);

  const isKnownStudent = Boolean(studentId && matchedStudent?.id === studentId);
  const isNewStudent = query.length > 0 && !matchedStudent;

  useEffect(() => {
    setActiveIndex(0);
  }, [query, suggestions.length]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(student: Student) {
    onSelectStudent(student);
    setOpen(false);
    inputRef.current?.blur();
  }

  function handleInputChange(name: string) {
    onChange(name);
    if (studentId) {
      const selected = students.find((s) => s.id === studentId);
      if (!selected || selected.name.toLowerCase() !== name.trim().toLowerCase()) {
        onClearStudent();
      }
    }
    setOpen(true);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && open && suggestions.length > 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'Tab' && open && suggestions.length === 1) {
      handleSelect(suggestions[0]);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1 flex items-center justify-between text-xs font-medium text-gray-600">
        <span>Saints Name *</span>
        {isKnownStudent && (
          <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
            <UserCheck className="h-3 w-3" /> Profile loaded
          </span>
        )}
        {isNewStudent && (
          <span className="flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
            <UserPlus className="h-3 w-3" /> New saints
          </span>
        )}
      </label>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Type name e.g. Aarav..."
          autoComplete="off"
          className={`w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm outline-none transition focus:ring-2 ${
            isKnownStudent
              ? 'border-success/40 bg-success/5 focus:border-success focus:ring-success/20'
              : 'border-gray-200 focus:border-accent focus:ring-accent/20'
          }`}
        />
      </div>

      <p className="mt-1 text-[10px] text-gray-400">
        Start typing — matching students auto-fill phone, address, class & age
      </p>

      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
          >
            {suggestions.map((student, index) => (
              <li key={student.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(student)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex w-full items-start gap-3 px-3 py-2.5 text-left transition ${
                    index === activeIndex ? 'bg-accent/10' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {highlightMatch(student.name, query)}
                    </p>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-gray-500 sm:text-xs">
                      {student.grade && (
                        <span className="flex items-center gap-0.5">
                          <GraduationCap className="h-3 w-3" /> {student.grade}
                        </span>
                      )}
                      {student.phone && (
                        <span className="flex items-center gap-0.5">
                          <Phone className="h-3 w-3" /> {student.phone}
                        </span>
                      )}
                      {student.address && (
                        <span className="flex items-center gap-0.5 truncate">
                          <MapPin className="h-3 w-3 shrink-0" /> {student.address}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export function studentToFormFields(
  student: Student,
  status: AttendanceStatus = 'present',
) {
  return {
    studentId: student.id,
    name: student.name,
    phone: student.phone ?? '',
    address: student.address ?? '',
    age: student.age != null ? String(student.age) : '',
    grade: student.grade ?? '',
    sanchalanSewa: student.sanchalanSewa ?? '',
    stageSewa: student.stageSewa ?? '',
    status,
  };
}
