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

export const DAILY_ATTENDANCE_NAMES_PER_COLUMN = 15;
export const DAILY_ATTENDANCE_NAME_COLUMN_COUNT = 4;
export const DAILY_ATTENDANCE_RECORDS_PER_PAGE =
  DAILY_ATTENDANCE_NAMES_PER_COLUMN * DAILY_ATTENDANCE_NAME_COLUMN_COUNT;

/** Approximate row height (mm) used to decide how many name rows fit on a page. */
export const DAILY_NAME_ROW_HEIGHT_MM = 11;
export const DAILY_NAME_HEADER_HEIGHT_MM = 14;
export const DAILY_PDF_BOTTOM_MARGIN_MM = 22;
export const DAILY_PDF_TOP_MARGIN_MM = 20;

function getDailyAttendanceNames(session: SundaySession): string[] {
  return session.attendance.map((r) => r.student.name).sort((a, b) => a.localeCompare(b));
}

export function getDailyNumberedNames(session: SundaySession): string[] {
  return getDailyAttendanceNames(session).map((name, index) => `${index + 1}. ${name}`);
}

/** How many name rows fit in the remaining vertical space (capped at 15). */
export function dailyNameRowsThatFit(availableHeightMm: number): number {
  const usable = availableHeightMm - DAILY_NAME_HEADER_HEIGHT_MM;
  if (usable < DAILY_NAME_ROW_HEIGHT_MM) return 0;
  return Math.max(
    0,
    Math.min(DAILY_ATTENDANCE_NAMES_PER_COLUMN, Math.floor(usable / DAILY_NAME_ROW_HEIGHT_MM)),
  );
}

/**
 * Build one page block: 4 columns filled column-by-column.
 * @param namesPerColumn — rows in each column for this page (e.g. 15, or fewer on page 1)
 */
export function buildDailyNameGridPage(
  pageNames: string[],
  namesPerColumn: number,
): { headers: string[]; rows: string[][] } {
  const headers = Array(DAILY_ATTENDANCE_NAME_COLUMN_COUNT).fill('Saints Name');
  const columns: string[][] = [];
  for (let c = 0; c < DAILY_ATTENDANCE_NAME_COLUMN_COUNT; c++) {
    const start = c * namesPerColumn;
    columns.push(pageNames.slice(start, start + namesPerColumn));
  }
  const rows: string[][] = [];
  for (let r = 0; r < namesPerColumn; r++) {
    rows.push(columns.map((col) => col[r] ?? ''));
  }
  return { headers, rows };
}

/**
 * Daily PDF: 4 columns × N numbered names per page.
 * Records fill column-by-column; when columns are full, continue on the next page.
 */
export function buildDailyNumberedNameGrids(
  session: SundaySession,
  namesPerColumn = DAILY_ATTENDANCE_NAMES_PER_COLUMN,
): { headers: string[]; rows: string[][] }[] {
  const numbered = getDailyNumberedNames(session);
  const perPage = namesPerColumn * DAILY_ATTENDANCE_NAME_COLUMN_COUNT;
  const grids: { headers: string[]; rows: string[][] }[] = [];

  if (numbered.length === 0) {
    grids.push(buildDailyNameGridPage([], namesPerColumn));
    return grids;
  }

  for (let offset = 0; offset < numbered.length; offset += perPage) {
    grids.push(buildDailyNameGridPage(numbered.slice(offset, offset + perPage), namesPerColumn));
  }

  return grids;
}
