import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Activity, AttendanceRecord, MonthData, SundaySession, YearData } from '../types';
import { ATTENDANCE_STATUS_MAP } from '../types';
import { monthName } from '../utils/formatters';
import {
  getMonthAverageAttendance,
  getMonthTotalPresent,
  getSessionStats,
  getYearAverageAttendance,
  getYearTotalSessions,
} from '../utils/stats';
import { sessionLabel } from '../utils/sundayHelpers';
import type { StudentAttendanceReport } from '../utils/studentReport';
import { buildAllStudentsSummary, type ReportScope } from '../utils/studentReport';
import type { Student } from '../types';
import {
  buildDailyNumberedNameGrids,
  buildMonthNameColumns,
  buildYearNameColumns,
} from '../utils/pdfNameColumns';

type JsPdfWithTable = jsPDF & { lastAutoTable: { finalY: number } };

export interface PdfExportOptions {
  /** When false, hides #/Name/Class/Phone/Age/Address/Status tables and name-column grids */
  includeStudentTables?: boolean;
}

interface DayPageContext {
  dateLabel: string;
  stats: ReturnType<typeof getSessionStats>;
}

const STUDENT_DETAIL_HEADERS = [
  '#',
  'Name',
  'Class',
  'Phone',
  'Age',
  'Address',
  'Sanchalan Sewa',
  'Stage Sewa',
  'Status',
] as const;

function studentDetailTableRow(record: AttendanceRecord, index: number): string[] {
  return [
    String(index + 1),
    record.student.name,
    record.student.grade ?? '-',
    record.student.phone ?? '-',
    record.student.age != null ? String(record.student.age) : '-',
    record.student.address ?? '-',
    record.student.sanchalanSewa ?? '-',
    record.student.stageSewa ?? '-',
    ATTENDANCE_STATUS_MAP[record.status].label,
  ];
}

function uniqueSewaNames(session: SundaySession, field: 'sanchalanSewa' | 'stageSewa'): string {
  const names = [
    ...new Set(
      session.attendance
        .map((r) => r.student[field]?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ];
  return names.length ? names.join(', ') : '-';
}

function buildSessionDetailCountRows(
  session: SundaySession,
  stats: ReturnType<typeof getSessionStats>,
): string[][] {
  return [
    ['Total Saints Count', String(stats.total)],
    // ['Saints Count', String(stats.came)],
    // ['Present', String(stats.present)],
    ['Sanchalan Sewa Name', uniqueSewaNames(session, 'sanchalanSewa')],
    ['Stage Sewa Name', uniqueSewaNames(session, 'stageSewa')],
  ];
}

function addHeader(doc: jsPDF, title: string, subtitle: string) {
  doc.setFillColor(30, 58, 95);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 14);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, 14, 22);
  doc.text('Bal Sangat Management Sewa', 196, 14, { align: 'right' });
  doc.setTextColor(0, 0, 0);
}

function addFooters(doc: jsPDF, pageContexts?: Map<number, DayPageContext>) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const ctx = pageContexts?.get(i);

    doc.setDrawColor(200, 200, 200);
    doc.line(14, 282, 196, 282);

    if (ctx) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 58, 95);
      doc.text(`Day: ${ctx.dateLabel}`, 14, 287);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(46, 125, 50);
      doc.text(
        // `Students Came: ${ctx.stats.came}/${ctx.stats.total}  |  Present: ${ctx.stats.present}  Absent: ${ctx.stats.absent}  Late: ${ctx.stats.late}  Excused: ${ctx.stats.excused}  |  Rate: ${ctx.stats.rate.toFixed(0)}%`,
        `Saints Present: ${ctx.stats.present}`,
        14,
        292,
      );
    }

    doc.setFontSize(7);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${pageCount} • Generated ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`,
      196,
      292,
      { align: 'right' },
    );
    doc.setTextColor(0, 0, 0);
  }
}

function buildAllDaysSummaryTable(
  doc: jsPDF,
  sessions: SundaySession[],
  startY: number,
  title: string,
): number {
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text(title, 14, startY);
  doc.setTextColor(0, 0, 0);

  const sorted = [...sessions].sort((a, b) => a.date.getTime() - b.date.getTime());

  autoTable(doc, {
    startY: startY + 4,
    head: [['#', 'Date', 'Day', 'Total', 'Came', 'Present', 'Absent', 'Late', 'Excused', 'Rate']],
    body: sorted.map((s, i) => {
      const st = getSessionStats(s);
      return [
        String(i + 1),
        format(s.date, 'dd MMM yyyy'),
        format(s.date, 'EEE'),
        String(st.total),
        String(st.came),
        String(st.present),
        String(st.absent),
        String(st.late),
        String(st.excused),
        `${st.rate.toFixed(0)}%`,
      ];
    }),
    foot: [
      [
        '',
        'TOTAL',
        '',
        String(sorted.reduce((s, x) => s + getSessionStats(x).total, 0)),
        String(sorted.reduce((s, x) => s + getSessionStats(x).came, 0)),
        String(sorted.reduce((s, x) => s + getSessionStats(x).present, 0)),
        String(sorted.reduce((s, x) => s + getSessionStats(x).absent, 0)),
        String(sorted.reduce((s, x) => s + getSessionStats(x).late, 0)),
        String(sorted.reduce((s, x) => s + getSessionStats(x).excused, 0)),
        '',
      ],
    ],
    headStyles: { fillColor: [30, 58, 95], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    footStyles: { fillColor: [230, 240, 250], textColor: [30, 58, 95], fontStyle: 'bold', fontSize: 7 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 14, right: 14 },
  });

  return (doc as JsPdfWithTable).lastAutoTable.finalY + 10;
}

function buildNamesColumnTable(
  doc: jsPDF,
  startY: number,
  title: string,
  headers: string[],
  rows: string[][],
): number {
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text(title, 14, startY);
  doc.setTextColor(0, 0, 0);

  if (rows.length === 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('No student names recorded.', 14, startY + 8);
    return startY + 16;
  }

  autoTable(doc, {
    startY: startY + 4,
    theme: 'plain',
    head: [headers],
    body: rows,
    margin: { left: 14, right: 14 },
    styles: {
      cellPadding: { top: 5, right: 4, bottom: 5, left: 5 },
      font: 'helvetica',
      lineWidth: 0,
      overflow: 'linebreak',
      valign: 'middle',
      fontSize: 9.5,
    },
    headStyles: {
      fillColor: [30, 58, 95],
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold',
      minCellHeight: 14,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 9.5,
      textColor: [48, 55, 64],
      minCellHeight: 14,
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  return (doc as JsPdfWithTable).lastAutoTable.finalY + 10;
}

function uniqueTopics(sessions: SundaySession[]): string[] {
  return [...new Set(sessions.map((s) => s.topic).filter((t): t is string => Boolean(t)))]
    .map((t) => t.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

function buildTopicsBlock(doc: jsPDF, startY: number, sessions: SundaySession[], subtitle?: string): number {
  const topics = uniqueTopics(sessions);
  if (topics.length === 0) return startY;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text('TOPICS', 14, startY);
  doc.setTextColor(0, 0, 0);

  if (subtitle) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text(subtitle, 14, startY + 5);
    doc.setTextColor(0, 0, 0);
  }

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  let y = startY + (subtitle ? 11 : 7);
  for (const t of topics) {
    doc.text(`• ${t}`, 16, y);
    y += 5;
    if (y > 265) {
      doc.addPage();
      y = 20;
    }
  }
  return y + 6;
}

function collectSessionActivities(sessions: SundaySession[]): Activity[] {
  return [...sessions]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .flatMap((session) => session.activities);
}

function buildActivitiesBlock(doc: jsPDF, startY: number, activities: Activity[]): number {
  let y = startY;
  if (y > 220) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Activities', 14, y);

  const body =
    activities.length > 0
      ? activities.map((activity) => [
          activity.title,
          activity.category,
          `${activity.durationMinutes ?? 0} min`,
          activity.description,
        ])
      : [['—', '—', '—', 'No activities recorded.']];

  autoTable(doc, {
    startY: y + 8,
    head: [['Activity', 'Category', 'Duration', 'Description']],
    body,
    headStyles: { fillColor: [30, 58, 95], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 14, right: 14 },
  });

  return (doc as JsPdfWithTable).lastAutoTable.finalY + 10;
}

/** Layout like screenshot: 4 boxes (Sunday 1-4) with names inside */
function buildMonthNamesBoxesLikeUI(doc: jsPDF, startY: number, monthData: MonthData): number {
  const grid = buildMonthNameColumns(monthData);
  const headers = ['Sunday 1', 'Sunday 2', 'Sunday 3', 'Sunday 4'];
  const subHeaders = ['Saints Name', 'Saints Name', 'Saints Name', 'Saints Name'];

  // Convert row-grid into per-column lists for a single-row table with multi-line cells
  const colLists = headers.map((_, colIdx) =>
    grid.rows.map((r) => (r[colIdx] ?? '').trim()).filter(Boolean),
  );
  const bodyRow = colLists.map((names) => names.join('\n') || '');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text('NAMES (SUNDAY 1–4)', 14, startY);
  doc.setTextColor(0, 0, 0);

  autoTable(doc, {
    startY: startY + 4,
    head: [headers, subHeaders],
    body: [bodyRow],
    margin: { left: 14, right: 14 },
    theme: 'grid',
    headStyles: { fillColor: [245, 247, 250], textColor: [30, 58, 95], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: 20, valign: 'top', minCellHeight: 70 },
    styles: {
      cellPadding: 3,
      overflow: 'linebreak',
    },
    tableLineColor: [220, 225, 232],
    tableLineWidth: 0.4,
    didParseCell: (hook) => {
      // Make "Student Name" row dark like screenshot
      if (hook.section === 'head' && hook.row.index === 1) {
        hook.cell.styles.fillColor = [30, 58, 95];
        hook.cell.styles.textColor = 255;
        hook.cell.styles.fontStyle = 'bold';
      }
    },
  });

  return (doc as JsPdfWithTable).lastAutoTable.finalY + 10;
}

function buildStudentSummaryTable(
  doc: jsPDF,
  years: YearData[],
  students: Student[],
  scope: ReportScope,
  startY: number,
  title: string,
): number {
  const rows = buildAllStudentsSummary(years, scope, students);
  if (rows.length === 0) return startY;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text(title, 14, startY);
  doc.setTextColor(0, 0, 0);

  autoTable(doc, {
    startY: startY + 4,
    head: [['#', 'Name', 'Class', 'Phone', 'Sessions', 'Present', 'Came', 'Absent', 'Late', 'Excused', 'Rate']],
    body: rows.map((row, i) => [
      String(i + 1),
      row.student.name,
      row.student.grade ?? '-',
      row.student.phone ?? '-',
      String(row.totalDays),
      String(row.present),
      String(row.cameDays),
      String(row.absent),
      String(row.late),
      String(row.excused),
      `${row.rate.toFixed(0)}%`,
    ]),
    headStyles: { fillColor: [30, 58, 95], textColor: 255, fontSize: 7 },
    bodyStyles: { fontSize: 7 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 14, right: 14 },
  });

  return (doc as JsPdfWithTable).lastAutoTable.finalY + 10;
}

function buildStudentProfileBox(doc: jsPDF, report: StudentAttendanceReport, startY: number): number {
  const { student } = report;
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(14, startY, 182, 28, 3, 3, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text(student.name, 18, startY + 8);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  const details = [
    student.grade ? `Class: ${student.grade}` : null,
    student.phone ? `Phone: ${student.phone}` : null,
    student.address ? `Address: ${student.address}` : null,
    student.age != null ? `Age: ${student.age}` : null,
    student.sanchalanSewa ? `Sanchalan Sewa: ${student.sanchalanSewa}` : null,
    student.stageSewa ? `Stage Sewa: ${student.stageSewa}` : null,
  ].filter(Boolean).join('  |  ');
  doc.text(details || 'No additional details', 18, startY + 15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(46, 125, 50);
  doc.text(
    `Present: ${report.present}  |  Came: ${report.cameDays}/${report.totalDays}  |  Rate: ${report.rate.toFixed(0)}%`,
    18,
    startY + 23,
  );
  doc.setTextColor(0, 0, 0);
  return startY + 34;
}

function buildAttendanceTable(
  doc: jsPDF,
  session: SundaySession,
  startY: number,
  pageContexts: Map<number, DayPageContext>,
): number {
  const stats = getSessionStats(session);
  const dateLabel = `${format(session.date, 'dd MMM yyyy')} (${sessionLabel(session.date)})`;
  const startPage = doc.getNumberOfPages();

  autoTable(doc, {
    startY,
    theme: 'plain',
    head: [STUDENT_DETAIL_HEADERS.slice()],
    body: session.attendance.map((r, i) => studentDetailTableRow(r, i)),
    margin: { left: 8, right: 8 },
    tableWidth: 'auto',
    styles: {
      cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
      font: 'helvetica',
      lineWidth: 0,
      overflow: 'linebreak',
      valign: 'middle',
      fontSize: 7.5,
    },
    headStyles: {
      fillColor: [30, 58, 95],
      textColor: 255,
      fontSize: 7.5,
      fontStyle: 'bold',
      minCellHeight: 12,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [48, 55, 64],
      minCellHeight: 12,
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 28, halign: 'left' },
      2: { cellWidth: 18, halign: 'left' },
      3: { cellWidth: 24, halign: 'left' },
      4: { cellWidth: 10, halign: 'center' },
      5: { cellWidth: 22, halign: 'left' },
      6: { cellWidth: 22, halign: 'left' },
      7: { cellWidth: 20, halign: 'left' },
      8: { cellWidth: 16, halign: 'center' },
    },
    didDrawPage: () => {
      const currentPage = doc.getNumberOfPages();
      pageContexts.set(currentPage, { dateLabel, stats });
    },
  });

  // Tag all pages this table touched
  const endPage = doc.getNumberOfPages();
  for (let p = startPage; p <= endPage; p++) {
    pageContexts.set(p, { dateLabel, stats });
  }

  return (doc as JsPdfWithTable).lastAutoTable.finalY;
}

/**
 * Full Student List table styled to match the Detail/Count summary table
 * (same header/body styling, same compact row height) — used only on the
 * daily (Sunday) attendance PDF.
 * Preserved: call is commented out in exportSunday; restore by swapping tables.
 */
export function buildAttendanceTableDetailStyle(
  doc: jsPDF,
  session: SundaySession,
  startY: number,
  pageContexts: Map<number, DayPageContext>,
): number {
  const stats = getSessionStats(session);
  const dateLabel = `${format(session.date, 'dd MMM yyyy')} (${sessionLabel(session.date)})`;
  const startPage = doc.getNumberOfPages();

  autoTable(doc, {
    startY,
    head: [STUDENT_DETAIL_HEADERS.slice()],
    body: session.attendance.map((r, i) => studentDetailTableRow(r, i)),
    margin: { left: 14, right: 14 },
    headStyles: { fillColor: [30, 58, 95], textColor: 255, fontSize: 7 },
    bodyStyles: { fontSize: 7 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: { 0: { fontStyle: 'bold' } },
    didDrawPage: () => {
      const currentPage = doc.getNumberOfPages();
      pageContexts.set(currentPage, { dateLabel, stats });
    },
  });

  const endPage = doc.getNumberOfPages();
  for (let p = startPage; p <= endPage; p++) {
    pageContexts.set(p, { dateLabel, stats });
  }

  return (doc as JsPdfWithTable).lastAutoTable.finalY;
}

function buildDailyAttendanceNumberedNamesTable(
  doc: jsPDF,
  session: SundaySession,
  startY: number,
  pageContexts: Map<number, DayPageContext>,
): number {
  const stats = getSessionStats(session);
  const dateLabel = `${format(session.date, 'dd MMM yyyy')} (${sessionLabel(session.date)})`;
  const startPage = doc.getNumberOfPages();
  const grids = buildDailyNumberedNameGrids(session);
  let y = startY;

  for (let i = 0; i < grids.length; i++) {
    const { headers, rows } = grids[i];
    if (i > 0) {
      doc.addPage();
      y = 20;
    }

    autoTable(doc, {
      startY: y,
      theme: 'plain',
      head: [headers],
      body: rows,
      margin: { left: 14, right: 14 },
      styles: {
        cellPadding: { top: 4, right: 4, bottom: 4, left: 5 },
        font: 'helvetica',
        lineWidth: 0.1,
        lineColor: [220, 220, 220],
        overflow: 'linebreak',
        valign: 'middle',
        fontSize: 9,
      },
      headStyles: {
        fillColor: [30, 58, 95],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold',
        minCellHeight: 12,
        halign: 'left',
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [48, 55, 64],
        minCellHeight: 11,
        halign: 'left',
      },
      didDrawPage: () => {
        const currentPage = doc.getNumberOfPages();
        pageContexts.set(currentPage, { dateLabel, stats });
      },
    });
    y = (doc as JsPdfWithTable).lastAutoTable.finalY + 8;
  }

  const endPage = doc.getNumberOfPages();
  for (let p = startPage; p <= endPage; p++) {
    pageContexts.set(p, { dateLabel, stats });
  }

  return y;
}

function renderSessionBlock(
  doc: jsPDF,
  session: SundaySession,
  y: number,
  pageContexts: Map<number, DayPageContext>,
  includeStudentTables = true,
): number {
  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  // Hidden: day summary box in year detailed reports
  // y = buildDayCountBox(doc, session, y);

  if (session.topic) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(`Topic: ${session.topic}`, 14, y);
    doc.setTextColor(0, 0, 0);
    y += 6;
  }

  if (includeStudentTables) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Student Details', 14, y);
    y += 4;
    y = buildAttendanceTable(doc, session, y, pageContexts) + 10;
  } else {
    y += 4;
  }

  return y;
}

export const pdfService = {
  exportYear(yearData: YearData, students: Student[] = [], options: PdfExportOptions = {}) {
    const includeStudentTables = options.includeStudentTables ?? true;
    const doc = new jsPDF();
    const pageContexts = new Map<number, DayPageContext>();
    addHeader(doc, 'Annual Attendance Report', `Year ${yearData.year}`);

    const allSessions = yearData.months.flatMap((m) => m.sundays);
    const totalCame = allSessions.reduce((s, x) => s + getSessionStats(x).came, 0);
    const totalStudents = allSessions.reduce((s, x) => s + getSessionStats(x).total, 0);

    let y = 36;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Days: ${getYearTotalSessions(yearData)}`, 14, y);
    doc.text(`Total Student Entries: ${totalStudents}`, 70, y);
    doc.text(`Total Students Came: ${totalCame}`, 140, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`Average Attendance: ${getYearAverageAttendance(yearData).toFixed(1)}%  |  Months: ${yearData.months.length}`, 14, y);
    y += 10;

    y = buildAllDaysSummaryTable(doc, allSessions, y, 'Day-by-Day Student Count (All Months)');

    if (includeStudentTables) {
      const yearNames = buildYearNameColumns(yearData);
      y = buildNamesColumnTable(
        doc,
        y,
        'Saints Names by Month (12 Columns)',
        yearNames.headers,
        yearNames.rows,
      );

      if (students.length > 0) {
        y = buildStudentSummaryTable(
          doc,
          [yearData],
          students,
          { type: 'year', year: yearData.year },
          y,
          'Each Saints — Days Present (Full Year)',
        );
      }
    }

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed Day Reports', 14, y);
    y += 8;

    for (const month of yearData.months) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 58, 95);
      doc.text(monthName(month.month), 14, y);
      doc.setTextColor(0, 0, 0);
      y += 8;

      for (const session of month.sundays) {
        y = renderSessionBlock(doc, session, y, pageContexts, includeStudentTables);
      }
    }

    y = buildActivitiesBlock(doc, y, collectSessionActivities(allSessions));

    addFooters(doc, pageContexts);
    doc.save(`attendance_${yearData.year}.pdf`);
  },

  exportMonth(monthData: MonthData, options: PdfExportOptions = {}) {
    const includeStudentTables = options.includeStudentTables ?? true;
    const doc = new jsPDF();
    const pageContexts = new Map<number, DayPageContext>();
    const mName = monthName(monthData.month);
    addHeader(doc, 'Monthly Attendance Report', `${mName} ${monthData.year}`);

    const totalCame = monthData.sundays.reduce((s, x) => s + getSessionStats(x).came, 0);
    const totalEntries = monthData.sundays.reduce((s, x) => s + getSessionStats(x).total, 0);

    let y = 36;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Days: ${monthData.sundays.length}`, 14, y);
    doc.text(`Saints Came (all days): ${totalCame}`, 70, y);
    doc.text(`Avg Rate: ${getMonthAverageAttendance(monthData).toFixed(0)}%`, 150, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Present marks: ${getMonthTotalPresent(monthData)}  |  Total entries: ${totalEntries}`, 14, y);
    y += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 95);
    doc.text(`${mName} — Day Count Summary`, 14, y);
    doc.setTextColor(0, 0, 0);
    y += 6;

    if (includeStudentTables) {
      y = buildMonthNamesBoxesLikeUI(doc, y, monthData);
    }

    for (const session of monthData.sundays) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      // Hidden: per-session summary card box
      // y = buildSessionSummaryCardLikeUI(doc, y, session);

      if (session.topic) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`Topic: ${session.topic}`, 14, y);
        y += 10;
      } else {
        y += 4;
      }

      if (includeStudentTables) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 58, 95);
        doc.text('Saints Details', 14, y);
        doc.setTextColor(0, 0, 0);
        y += 5;
        y = buildAttendanceTable(doc, session, y, pageContexts) + 10;
      }
    }

    // Topics at bottom (like screenshot)
    y = buildTopicsBlock(doc, y, monthData.sundays, `${monthData.sundays.length} sessions`);

    y = buildActivitiesBlock(doc, y, collectSessionActivities(monthData.sundays));

    addFooters(doc, pageContexts);
    doc.save(`attendance_${mName}_${monthData.year}.pdf`);
  },

  exportSunday(session: SundaySession, year: number, month: number, options: PdfExportOptions = {}) {
    const includeStudentTables = options.includeStudentTables ?? true;
    const doc = new jsPDF();
    const pageContexts = new Map<number, DayPageContext>();
    const mName = monthName(month);
    const stats = getSessionStats(session);
    const dateLabel = format(session.date, 'EEEE, dd MMM yyyy');

    addHeader(
      doc,
      'Attendance Report',
      // `${sessionLabel(session.date)} — ${format(session.date, 'dd MMM yyyy')}`,
      `${format(session.date, 'EEEE, dd MMM yyyy')}`,
    );

    let y = 36;
    // doc.setFontSize(10);
    // doc.text(`${mName} ${year}`, 14, y);
    y += 1;

    // Hidden: day summary box (Total / Came / Present card)
    // y = buildDayCountBox(doc, session, y);

    if (session.topic) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Topic: ${session.topic ?? 'N/A'}`, 14, y);
      y += 8;
    }

    // Summary stats table — Absent / Late / Excused / Rate removed per request
    autoTable(doc, {
      startY: y,
      head: [['Detail', 'Count']],
      body: buildSessionDetailCountRows(session, stats),
      headStyles: { fillColor: [30, 58, 95], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
      columnStyles: { 0: { fontStyle: 'bold' } },
    });
    y = (doc as JsPdfWithTable).lastAutoTable.finalY + 10;

    if (includeStudentTables) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Saints Details', 14, y);
      y += 4;

      // Hidden: single-column names-only table
      // const dayNames = buildDayNameColumn(session);
      // y = buildNamesColumnTable(doc, y, 'Student Names (1 Column)', dayNames.headers, dayNames.rows);

      // Hidden: full details table (# | Name | Class | Phone | Age | Address | Sanchalan Sewa | Stage Sewa | Status)
      // y = buildAttendanceTableDetailStyle(doc, session, y, pageContexts) + 8;

      y = buildDailyAttendanceNumberedNamesTable(doc, session, y, pageContexts);
    }

    y = buildActivitiesBlock(doc, y, session.activities);

    pageContexts.set(1, { dateLabel, stats });
    addFooters(doc, pageContexts);
    doc.save(`attendance_${format(session.date, 'dd-MMM-yyyy')}_${mName}_${year}.pdf`);
  },

  exportStudentReport(report: StudentAttendanceReport) {
    const doc = new jsPDF();
    addHeader(doc, 'Saints Attendance Report', report.scopeLabel);

    let y = 36;
    y = buildStudentProfileBox(doc, report, y);

    autoTable(doc, {
      startY: y,
      head: [['Detail', 'Count']],
      body: [
        ['Total Sessions', String(report.totalDays)],
        ['Days Present', String(report.present)],
        ['Days Came (Present + Late)', String(report.cameDays)],
        ['Absent', String(report.absent)],
        ['Late', String(report.late)],
        ['Excused', String(report.excused)],
        ['Attendance Rate', `${report.rate.toFixed(1)}%`],
        ['Sanchalan Sewa Name', report.student.sanchalanSewa?.trim() || '-'],
        ['Stage Sewa Name', report.student.stageSewa?.trim() || '-'],
      ],
      headStyles: { fillColor: [30, 58, 95], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
      columnStyles: { 0: { fontStyle: 'bold' } },
    });
    y = (doc as JsPdfWithTable).lastAutoTable.finalY + 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Day-by-Day Record', 14, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [['#', 'Date', 'Day', 'Session', 'Topic', 'Status']],
      body: report.days.map((d, i) => [
        String(i + 1),
        format(d.date, 'dd MMM yyyy'),
        format(d.date, 'EEE'),
        d.label,
        d.topic ?? '-',
        ATTENDANCE_STATUS_MAP[d.status].label,
      ]),
      headStyles: { fillColor: [30, 58, 95], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: 14, right: 14 },
    });

    addFooters(doc);
    const safeName = report.student.name.replace(/\s+/g, '_');
    doc.save(`student_${safeName}_${report.scopeLabel.replace(/\s+/g, '_')}.pdf`);
  },
};