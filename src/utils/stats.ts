import type { AttendanceStatus, MonthData, SundaySession, YearData } from '../types';

export function getPresentCount(session: SundaySession): number {
  return session.attendance.filter((r) => r.status === 'present').length;
}

export function getAbsentCount(session: SundaySession): number {
  return session.attendance.filter((r) => r.status === 'absent').length;
}

export function getAttendanceRate(session: SundaySession): number {
  if (session.attendance.length === 0) return 0;
  return (getPresentCount(session) / session.attendance.length) * 100;
}

export function getMonthTotalPresent(month: MonthData): number {
  return month.sundays.reduce((sum, s) => sum + getPresentCount(s), 0);
}

export function getMonthAverageAttendance(month: MonthData): number {
  if (month.sundays.length === 0) return 0;
  const rates = month.sundays.map(getAttendanceRate);
  return rates.reduce((a, b) => a + b, 0) / rates.length;
}

export function getYearTotalSessions(year: YearData): number {
  return year.months.reduce((sum, m) => sum + m.sundays.length, 0);
}

export function getYearAverageAttendance(year: YearData): number {
  if (year.months.length === 0) return 0;
  const rates = year.months.map(getMonthAverageAttendance);
  return rates.reduce((a, b) => a + b, 0) / rates.length;
}

export function getLateCount(session: SundaySession): number {
  return session.attendance.filter((r) => r.status === 'late').length;
}

export function getExcusedCount(session: SundaySession): number {
  return session.attendance.filter((r) => r.status === 'excused').length;
}

export function getTotalStudents(session: SundaySession): number {
  return session.attendance.length;
}

/** Students who came (present + late) */
export function getCameCount(session: SundaySession): number {
  return session.attendance.filter((r) => r.status === 'present' || r.status === 'late').length;
}

export function getBoyCount(session: SundaySession): number {
  return session.attendance.filter((r) => r.student.gender === 'boy').length;
}

export function getGirlCount(session: SundaySession): number {
  return session.attendance.filter((r) => r.student.gender === 'girl').length;
}

export function genderLabel(gender?: 'boy' | 'girl' | null): string {
  if (gender === 'boy') return 'Boy';
  if (gender === 'girl') return 'Girl';
  return '—';
}

export interface SessionStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  came: number;
  boys: number;
  girls: number;
  rate: number;
}

export function getSessionStats(session: SundaySession): SessionStats {
  const present = getPresentCount(session);
  const absent = getAbsentCount(session);
  const late = getLateCount(session);
  const excused = getExcusedCount(session);
  const total = session.attendance.length;
  const came = present + late;
  return {
    total,
    present,
    absent,
    late,
    excused,
    came,
    boys: getBoyCount(session),
    girls: getGirlCount(session),
    rate: total === 0 ? 0 : (came / total) * 100,
  };
}

export function statusColor(status: AttendanceStatus): string {
  switch (status) {
    case 'present':
      return '#2e7d32';
    case 'absent':
      return '#c62828';
    case 'late':
      return '#f57c00';
    case 'excused':
      return '#4a90d9';
    default:
      return '#9e9e9e';
  }
}

export function categoryColor(category: string): string {
  switch (category.toLowerCase()) {
    case 'Physical Activity':
      return '#1e3a5f';
    case 'Mental Activity':
      return '#4a90d9';
    case 'Sewadal':
      return '#2e7d32';
    case 'Volunteers':
      return '#f57c00';
    default:
      return '#9e9e9e';
  }
}
