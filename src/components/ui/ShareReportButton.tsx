import { Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { MonthData, SundaySession, YearData } from '../../types';
import { monthName } from '../../utils/formatters';
import {
  getMonthAverageAttendance,
  getMonthTotalPresent,
  getSessionStats,
  getYearAverageAttendance,
  getYearTotalSessions,
} from '../../utils/stats';
import { buildAllStudentsSummary, formatStudentReportText, buildStudentReport, type ReportScope } from '../../utils/studentReport';
import type { Student } from '../../types';
import { useData } from '../../context/DataContext';

interface ShareReportButtonProps {
  label?: string;
}

function buildScopeText(
  scope: ReportScope,
  scopeLabel: string,
  years: YearData[],
  students: Student[],
): string {
  const summary = buildAllStudentsSummary(years, scope, students);
  const lines = [
    `ATTENDANCE REPORT — ${scopeLabel}`,
    `Generated: ${new Date().toLocaleString()}`,
    '',
    'SUMMARY',
  ];

  if (scope.type === 'year') {
    const yearData = years.find((y) => y.year === scope.year);
    if (yearData) {
      lines.push(`Total Sessions: ${getYearTotalSessions(yearData)}`);
      lines.push(`Average Attendance: ${getYearAverageAttendance(yearData).toFixed(0)}%`);
    }
  } else if (scope.type === 'month') {
    const monthData = years
      .flatMap((y) => y.months)
      .find((m) => m.year === scope.year && m.month === scope.month);
    if (monthData) {
      lines.push(`Total Sessions: ${monthData.sundays.length}`);
      lines.push(`Total Present: ${getMonthTotalPresent(monthData)}`);
      lines.push(`Average: ${getMonthAverageAttendance(monthData).toFixed(0)}%`);
    }
  } else if (scope.type === 'session') {
    const session = years
      .flatMap((y) => y.months)
      .flatMap((m) => m.sundays)
      .find(
        (s) =>
          s.date.getFullYear() === scope.year &&
          s.date.getMonth() + 1 === scope.month &&
          s.date.getDate() === scope.date.getDate(),
      );
    if (session) {
      const stats = getSessionStats(session);
      lines.push(`Students: ${stats.total}`);
      lines.push(`Came: ${stats.came}`);
      lines.push(`Present: ${stats.present}`);
      lines.push(`Rate: ${stats.rate.toFixed(0)}%`);
      if (session.topic) lines.push(`Topic: ${session.topic}`);
    }
  }

  lines.push('', 'EACH STUDENT — DAYS PRESENT');
  for (const row of summary) {
    lines.push(
      `${row.student.name}: Present ${row.present}/${row.totalDays} | Came ${row.cameDays} | Absent ${row.absent} | Rate ${row.rate.toFixed(0)}%`,
    );
  }

  return lines.join('\n');
}

export function ShareYearReportButton({ yearData, label = 'Share' }: ShareReportButtonProps & { yearData: YearData }) {
  const { students, years } = useData();

  async function handleShare() {
    const text = buildScopeText(
      { type: 'year', year: yearData.year },
      `Year ${yearData.year}`,
      years,
      students,
    );
    if (navigator.share) {
      try {
        await navigator.share({ title: `Year ${yearData.year} Attendance`, text });
        return;
      } catch { /* clipboard fallback */ }
    }
    await navigator.clipboard.writeText(text);
    alert('Year report copied to clipboard.');
  }

  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={handleShare}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2.5 text-xs font-semibold text-white transition hover:bg-white/20 sm:px-3 sm:text-sm"
    >
      <Share2 className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </motion.button>
  );
}

export function ShareMonthReportButton({ monthData, label = 'Share' }: ShareReportButtonProps & { monthData: MonthData }) {
  const { students, years } = useData();
  const mName = monthName(monthData.month);

  async function handleShare() {
    const text = buildScopeText(
      { type: 'month', year: monthData.year, month: monthData.month },
      `${mName} ${monthData.year}`,
      years,
      students,
    );
    if (navigator.share) {
      try {
        await navigator.share({ title: `${mName} ${monthData.year} Attendance`, text });
        return;
      } catch { /* clipboard fallback */ }
    }
    await navigator.clipboard.writeText(text);
    alert('Month report copied to clipboard.');
  }

  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={handleShare}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2.5 text-xs font-semibold text-white transition hover:bg-white/20 sm:px-3 sm:text-sm"
    >
      <Share2 className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </motion.button>
  );
}

export function ShareSessionReportButton({ session, year, month, label = 'Share' }: ShareReportButtonProps & {
  session: SundaySession;
  year: number;
  month: number;
}) {
  const { students, years } = useData();

  async function handleShare() {
    const text = buildScopeText(
      { type: 'session', year, month, date: session.date },
      `${session.date.toLocaleDateString()}`,
      years,
      students,
    );
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Session Attendance', text });
        return;
      } catch { /* clipboard fallback */ }
    }
    await navigator.clipboard.writeText(text);
    alert('Session report copied to clipboard.');
  }

  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={handleShare}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2.5 text-xs font-semibold text-white transition hover:bg-white/20 sm:px-3 sm:text-sm"
    >
      <Share2 className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </motion.button>
  );
}

export { formatStudentReportText, buildStudentReport };
