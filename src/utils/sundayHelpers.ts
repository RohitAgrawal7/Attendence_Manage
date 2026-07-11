import type { SundaySession } from '../types';

export function getSundayWeekNumber(date: Date): number {
  if (date.getDay() !== 0) return date.getDate();
  let count = 0;
  const cursor = new Date(date.getFullYear(), date.getMonth(), 1);
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  while (cursor <= target) {
    if (cursor.getDay() === 0) count++;
    cursor.setDate(cursor.getDate() + 1);
  }

  return count || date.getDate();
}

export function isSunday(date: Date): boolean {
  return date.getDay() === 0;
}

export function getSundaysInMonth(year: number, month: number): Date[] {
  const sundays: Date[] = [];
  const cursor = new Date(year, month - 1, 1);

  while (cursor.getMonth() === month - 1) {
    if (cursor.getDay() === 0) sundays.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return sundays;
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function createEmptySession(date: Date): SundaySession {
  return {
    weekNumber: getSundayWeekNumber(date),
    date: new Date(date),
    attendance: [],
    activities: [],
    topic: isSunday(date) ? 'Sunday Session' : 'Attendance Session',
  };
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateKey(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function sessionLabel(date: Date): string {
  return isSunday(date) ? `Sunday ${getSundayWeekNumber(date)}` : formatShortDate(date);
}

function formatShortDate(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${days[date.getDay()]}, ${date.getDate()}`;
}

// Legacy aliases
export const createEmptySundaySession = createEmptySession;
export const toDateInputValue = toDateKey;
export const parseDateInput = parseDateKey;
