import type { MonthData, SundaySession, YearData } from '../types';
import { monthName } from './formatters';
import { sessionLabel } from './sundayHelpers';

/** Students who came (present + late) */
export function getCameNames(session: SundaySession): string[] {
  return session.attendance
    .filter((r) => r.status === 'present' || r.status === 'late')
    .map((r) => r.student.name)
    .sort((a, b) => a.localeCompare(b));
}

export function getAllNames(session: SundaySession): string[] {
  return session.attendance.map((r) => r.student.name).sort((a, b) => a.localeCompare(b));
}

export function buildColumnGrid(headers: string[], columns: string[][]): string[][] {
  const maxRows = Math.max(1, ...columns.map((c) => c.length));
  const rows: string[][] = [];
  for (let i = 0; i < maxRows; i++) {
    rows.push(columns.map((col) => col[i] ?? ''));
  }
  return [headers, ...rows];
}

/** Year PDF: 12 month columns of student names */
export function buildYearNameColumns(yearData: YearData): { headers: string[]; rows: string[][] } {
  const headers: string[] = [];
  const columns: string[][] = [];

  for (let m = 1; m <= 12; m++) {
    const monthData = yearData.months.find((x) => x.month === m);
    headers.push(monthName(m).slice(0, 3));

    if (!monthData) {
      columns.push([]);
      continue;
    }

    const names = new Set<string>();
    for (const session of monthData.sundays) {
      for (const name of getCameNames(session)) {
        names.add(name);
      }
    }
    columns.push([...names].sort((a, b) => a.localeCompare(b)));
  }

  return { headers, rows: buildColumnGrid(headers, columns).slice(1) };
}

/** Month PDF: 4 session columns of student names */
export function buildMonthNameColumns(monthData: MonthData): { headers: string[]; rows: string[][] } {
  const sorted = [...monthData.sundays].sort((a, b) => a.date.getTime() - b.date.getTime());
  const sessions = sorted.slice(0, 4);

  while (sessions.length < 4) {
    sessions.push(null as unknown as SundaySession);
  }

  const headers = sessions.map((s, i) =>
    s ? sessionLabel(s.date).slice(0, 8) : `Week ${i + 1}`,
  );
  const columns = sessions.map((s) => (s ? getCameNames(s) : []));

  return { headers, rows: buildColumnGrid(headers, columns).slice(1) };
}

/** Day PDF: 1 column of student names */
export function buildDayNameColumn(session: SundaySession): { headers: string[]; rows: string[][] } {
  const names = getCameNames(session);
  return {
    headers: ['Saints Name'],
    rows: names.map((n) => [n]),
  };
}

export const DAILY_ATTENDANCE_NAMES_PER_COLUMN = 25;
export const DAILY_ATTENDANCE_NAME_COLUMN_COUNT = 4;

function getDailyAttendanceNames(session: SundaySession): string[] {
  return session.attendance.map((r) => r.student.name).sort((a, b) => a.localeCompare(b));
}

/** Daily PDF: 4 columns × 25 numbered names, then next page block if needed */
export function buildDailyNumberedNameGrids(
  session: SundaySession,
): { headers: string[]; rows: string[][] }[] {
  const names = getDailyAttendanceNames(session);
  const numbered = names.map((name, index) => `${index + 1}. ${name}`);
  const namesPerPage = DAILY_ATTENDANCE_NAMES_PER_COLUMN * DAILY_ATTENDANCE_NAME_COLUMN_COUNT;
  const headers = Array(DAILY_ATTENDANCE_NAME_COLUMN_COUNT).fill('Saints Name');
  const grids: { headers: string[]; rows: string[][] }[] = [];

  const buildGrid = (pageNames: string[]) => {
    const columns: string[][] = [];
    for (let c = 0; c < DAILY_ATTENDANCE_NAME_COLUMN_COUNT; c++) {
      columns.push(
        pageNames.slice(
          c * DAILY_ATTENDANCE_NAMES_PER_COLUMN,
          (c + 1) * DAILY_ATTENDANCE_NAMES_PER_COLUMN,
        ),
      );
    }
    const rows: string[][] = [];
    for (let r = 0; r < DAILY_ATTENDANCE_NAMES_PER_COLUMN; r++) {
      rows.push(columns.map((col) => col[r] ?? ''));
    }
    grids.push({ headers, rows });
  };

  if (numbered.length === 0) {
    buildGrid([]);
    return grids;
  }

  for (let offset = 0; offset < numbered.length; offset += namesPerPage) {
    buildGrid(numbered.slice(offset, offset + namesPerPage));
  }

  return grids;
}
