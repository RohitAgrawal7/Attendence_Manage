import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  ActivityFormInput,
  AttendanceActionResult,
  AttendanceFormInput,
  DeleteActivityInput,
  DeleteAttendanceInput,
  EditTarget,
  MonthData,
  PatchAttendanceInput,
  SessionDateInput,
  Student,
  SundaySession,
  UpdateStudentInput,
  YearData,
} from '../types';
import { api, type BootstrapData } from '../services/api';
import { sameDay, toDateKey } from '../utils/sundayHelpers';

const BOOTSTRAP_CACHE_KEY = 'sm_bootstrap_cache_v1';

function readBootstrapCache(): BootstrapData | null {
  try {
    const raw = sessionStorage.getItem(BOOTSTRAP_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BootstrapData;
    if (!parsed?.students || !parsed?.years) return null;
    return {
      students: parsed.students,
      years: parsed.years.map((y) => ({
        ...y,
        months: y.months.map((m) => ({
          ...m,
          sundays: m.sundays.map((s) => ({
            ...s,
            date: new Date(s.date),
          })),
        })),
      })),
    };
  } catch {
    return null;
  }
}

function writeBootstrapCache(data: BootstrapData) {
  try {
    sessionStorage.setItem(BOOTSTRAP_CACHE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

interface DataContextValue {
  students: Student[];
  years: YearData[];
  loading: boolean;
  error: string | null;
  staleWarning: boolean;
  editTarget: EditTarget | null;
  getYear: (year: number) => YearData | undefined;
  getMonth: (year: number, month: number) => MonthData | undefined;
  getSunday: (year: number, month: number, weekNumber: number) => SundaySession | undefined;
  getSessionByDate: (year: number, month: number, date: Date) => SundaySession | undefined;
  refresh: () => Promise<void>;
  saveAttendance: (input: AttendanceFormInput) => Promise<AttendanceActionResult>;
  updateSessionTopic: (input: SessionDateInput & { topic: string }) => Promise<void>;
  saveActivity: (input: ActivityFormInput) => Promise<void>;
  deleteActivity: (input: DeleteActivityInput) => Promise<void>;
  patchAttendance: (input: PatchAttendanceInput) => Promise<void>;
  deleteAttendance: (input: DeleteAttendanceInput) => Promise<boolean>;
  updateStudent: (input: UpdateStudentInput) => Promise<void>;
  deleteStudent: (id: string) => Promise<boolean>;
  deleteSession: (input: SessionDateInput) => Promise<void>;
  deleteMonth: (year: number, month: number) => Promise<void>;
  setEditTarget: (target: EditTarget | null) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

function findSessionByDate(sundays: SundaySession[], date: Date): SundaySession | undefined {
  return sundays.find((s) => sameDay(s.date, date));
}

export function DataProvider({ children }: { children: ReactNode }) {
  const cached = typeof sessionStorage !== 'undefined' ? readBootstrapCache() : null;
  const [students, setStudents] = useState<Student[]>(cached?.students ?? []);
  const [years, setYears] = useState<YearData[]>(cached?.years ?? []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [staleWarning, setStaleWarning] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  const refresh = useCallback(async () => {
    const data = await api.getBootstrap();
    setStudents(data.students);
    setYears(data.years);
    writeBootstrapCache(data);
    setError(null);
    setStaleWarning(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!cached) setLoading(true);
        await refresh();
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load data from API';
          if (cached) {
            setStaleWarning(true);
            setError(message);
          } else {
            setError(message);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  const getYear = useCallback((year: number) => years.find((y) => y.year === year), [years]);

  const getMonth = useCallback(
    (year: number, month: number) => getYear(year)?.months.find((m) => m.month === month),
    [getYear],
  );

  const getSunday = useCallback(
    (year: number, month: number, weekNumber: number) =>
      getMonth(year, month)?.sundays.find((s) => s.weekNumber === weekNumber),
    [getMonth],
  );

  const getSessionByDate = useCallback(
    (year: number, month: number, date: Date) => {
      const monthData = getMonth(year, month);
      if (!monthData) return undefined;
      return findSessionByDate(monthData.sundays, date);
    },
    [getMonth],
  );

  const saveAttendance = useCallback(
    async (input: AttendanceFormInput): Promise<AttendanceActionResult> => {
      const result = await api.saveAttendance(input);
      await refresh();
      setEditTarget(null);
      return result;
    },
    [refresh],
  );

  const patchAttendance = useCallback(
    async (input: PatchAttendanceInput) => {
      await api.patchAttendance(input);
      await refresh();
    },
    [refresh],
  );

  const deleteAttendance = useCallback(
    async (input: DeleteAttendanceInput): Promise<boolean> => {
      try {
        await api.deleteAttendance(input);
        await refresh();
        setEditTarget(null);
        return true;
      } catch {
        return false;
      }
    },
    [refresh],
  );

  const updateStudent = useCallback(
    async (input: UpdateStudentInput) => {
      await api.updateStudent(input);
      await refresh();
    },
    [refresh],
  );

  const deleteStudent = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await api.deleteStudent(id);
        await refresh();
        return true;
      } catch {
        return false;
      }
    },
    [refresh],
  );

  const updateSessionTopic = useCallback(
    async (input: SessionDateInput & { topic: string }) => {
      await api.updateSessionTopic(input);
      await refresh();
    },
    [refresh],
  );

  const saveActivity = useCallback(
    async (input: ActivityFormInput) => {
      await api.saveActivity(input);
      await refresh();
    },
    [refresh],
  );

  const deleteActivity = useCallback(
    async (input: DeleteActivityInput) => {
      await api.deleteActivity(input);
      await refresh();
    },
    [refresh],
  );

  const deleteSession = useCallback(
    async (input: SessionDateInput) => {
      await api.deleteSession(toDateKey(input.date));
      await refresh();
    },
    [refresh],
  );

  const deleteMonth = useCallback(
    async (year: number, month: number) => {
      await api.deleteMonth(year, month);
      await refresh();
    },
    [refresh],
  );

  const value = useMemo(
    () => ({
      students,
      years,
      loading,
      error,
      staleWarning,
      editTarget,
      getYear,
      getMonth,
      getSunday,
      getSessionByDate,
      refresh,
      saveAttendance,
      updateSessionTopic,
      saveActivity,
      deleteActivity,
      deleteSession,
      deleteMonth,
      patchAttendance,
      deleteAttendance,
      updateStudent,
      deleteStudent,
      setEditTarget,
    }),
    [
      students,
      years,
      loading,
      error,
      staleWarning,
      editTarget,
      getYear,
      getMonth,
      getSunday,
      getSessionByDate,
      refresh,
      saveAttendance,
      updateSessionTopic,
      saveActivity,
      deleteActivity,
      deleteSession,
      deleteMonth,
      patchAttendance,
      deleteAttendance,
      updateStudent,
      deleteStudent,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
