import type { DataPdfEntry, MonthData, SundaySession, YearData } from '../types';
import { monthName } from './formatters';
import { format } from 'date-fns';
import { sessionLabel } from './sundayHelpers';

const CUSTOM_STORAGE_KEY = 'student_mgmt_custom_pdfs';

function sessionDateLabel(date: Date): string {
  return sessionLabel(date).startsWith('Sunday')
    ? sessionLabel(date)
    : format(date, 'EEE, dd MMM yyyy');
}

function buildDateTopics(sessions: SundaySession[]): string[] {
  return [...sessions]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((s) => {
      const label = sessionDateLabel(s.date);
      const topic = s.topic?.trim() || 'No topic';
      return `${format(s.date, 'dd MMM yyyy')} (${label}): ${topic}`;
    });
}

export function getCustomPdfEntries(scopeKey: string): DataPdfEntry[] {
  try {
    const raw = localStorage.getItem(CUSTOM_STORAGE_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as Record<string, DataPdfEntry[]>;
    return all[scopeKey] ?? [];
  } catch {
    return [];
  }
}

export function saveCustomPdfEntry(scopeKey: string, entry: DataPdfEntry): DataPdfEntry[] {
  const raw = localStorage.getItem(CUSTOM_STORAGE_KEY);
  const all: Record<string, DataPdfEntry[]> = raw ? JSON.parse(raw) : {};
  const list = all[scopeKey] ?? [];
  all[scopeKey] = [...list, entry];
  localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(all));
  return all[scopeKey];
}

export function removeCustomPdfEntry(scopeKey: string, id: string): DataPdfEntry[] {
  const raw = localStorage.getItem(CUSTOM_STORAGE_KEY);
  if (!raw) return [];
  const all = JSON.parse(raw) as Record<string, DataPdfEntry[]>;
  all[scopeKey] = (all[scopeKey] ?? []).filter((e) => e.id !== id);
  localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(all));
  return all[scopeKey] ?? [];
}

export function buildYearPdfEntries(yearData: YearData): DataPdfEntry[] {
  const allSessions = yearData.months.flatMap((m) => m.sundays);
  const dateTopics = buildDateTopics(allSessions);

  const entries: DataPdfEntry[] = [
    {
      id: `year-${yearData.year}`,
      name: `Year ${yearData.year} — All Dates PDF`,
      topics: dateTopics,
      description: `${yearData.months.length} months • ${allSessions.length} sessions • all dates & topics`,
    },
  ];

  for (const month of yearData.months) {
    entries.push(buildMonthSummaryEntry(month));
  }

  return entries;
}

function buildMonthSummaryEntry(month: MonthData): DataPdfEntry {
  const mName = monthName(month.month);
  const dateTopics = buildDateTopics(month.sundays);

  return {
    id: `month-${month.year}-${month.month}`,
    name: `${mName} ${month.year} — All Dates PDF`,
    topics: dateTopics,
    description: `${month.sundays.length} sessions • all dates & topics`,
  };
}

export function buildMonthPdfEntries(monthData: MonthData): DataPdfEntry[] {
  const entries: DataPdfEntry[] = [buildMonthSummaryEntry(monthData)];

  for (const session of monthData.sundays) {
    entries.push(buildSessionPdfEntry(session, monthData.year, monthData.month));
  }

  return entries;
}

export function buildSessionPdfEntry(
  session: SundaySession,
  year: number,
  month: number,
): DataPdfEntry {
  const label = sessionDateLabel(session.date);
  const mName = monthName(month);
  const topic = session.topic?.trim() || 'No topic';

  return {
    id: `session-${year}-${month}-${session.weekNumber}`,
    name: `${label} (${format(session.date, 'dd MMM')}) — ${topic}`,
    topics: [`${format(session.date, 'dd MMM yyyy')}: ${topic}`],
    description: `${session.attendance.length} students • ${session.activities.length} activities • ${mName} ${year}`,
  };
}
