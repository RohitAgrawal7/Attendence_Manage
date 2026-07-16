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
  buildDailyNameGridPage,
  buildMonthNameColumns,
  buildYearNameColumns,
  DAILY_ATTENDANCE_NAME_COLUMN_COUNT,
  DAILY_ATTENDANCE_NAMES_PER_COLUMN,
  DAILY_PDF_BOTTOM_MARGIN_MM,
  DAILY_PDF_TOP_MARGIN_MM,
  dailyNameRowsThatFit,
  getDailyNumberedNames,
} from '../utils/pdfNameColumns';
import { formatActivityDescriptionForPdf, formatPdfCellText } from '../utils/pdfText';
import type { StudentListEntry } from '../utils/studentList';

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
  'Gender',
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
    record.student.gender === 'boy' ? 'Boy' : record.student.gender === 'girl' ? 'Girl' : '-',
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
    ['Boys Count', String(stats.boys)],
    ['Girls Count', String(stats.girls)],
    // ['Saints Count', String(stats.came)],
    // ['Present', String(stats.present)],
    ['Sanchalan Sewa Name', uniqueSewaNames(session, 'sanchalanSewa')],
    ['Stage Sewa Name', uniqueSewaNames(session, 'stageSewa')],
  ];
}

function addHeader(doc: jsPDF, title: string, subtitle: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(30, 58, 95);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 14);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, 14, 22);
  doc.text('Bal Sangat Management Sewa', pageWidth - 14, 14, { align: 'right' });
  doc.setTextColor(0, 0, 0);
}

function addFooters(doc: jsPDF, pageContexts?: Map<number, DayPageContext>) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const ctx = pageContexts?.get(i);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const footerY = pageHeight - 15;

    doc.setDrawColor(200, 200, 200);
    doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);

    if (ctx) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 58, 95);
      doc.text(`Day: ${ctx.dateLabel}`, 14, footerY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(46, 125, 50);
      doc.text(`Saints Present: ${ctx.stats.present}`, 14, footerY + 5);
    }

    doc.setFontSize(7);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${pageCount} • Generated ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`,
      pageWidth - 14,
      footerY + 5,
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

function collectSessionActivities(
  sessions: SundaySession[],
): { activity: Activity; sessionDate?: string }[] {
  return [...sessions]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .flatMap((session) =>
      session.activities.map((activity) => ({
        activity,
        sessionDate: format(session.date, 'dd MMM'),
      })),
    );
}

function buildActivitiesBlock(
  doc: jsPDF,
  startY: number,
  items: { activity: Activity; sessionDate?: string }[],
): number {
  let y = startY;
  if (y > 220) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Activities', 14, y);

  const showSessionDate = items.some((item) => item.sessionDate);
  const body =
    items.length > 0
      ? items.map(({ activity, sessionDate }) => {
          const title = formatPdfCellText(activity.title);
          const activityLabel =
            showSessionDate && sessionDate ? `${sessionDate} — ${title}` : title;

          return [
            activityLabel,
            formatPdfCellText(activity.category),
            `${activity.durationMinutes ?? 0} min`,
            formatActivityDescriptionForPdf(activity.description),
          ];
        })
      : [['—', '—', '—', 'No activities recorded.']];

  autoTable(doc, {
    startY: y + 8,
    head: [['Activity', 'Category', 'Duration', 'Description']],
    body,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    styles: {
      font: 'helvetica',
      fontSize: 8,
      halign: 'left',
      valign: 'top',
      overflow: 'linebreak',
      cellPadding: { top: 4, right: 4, bottom: 4, left: 4 },
      lineWidth: 0.1,
      lineColor: [220, 225, 232],
    },
    headStyles: {
      fillColor: [30, 58, 95],
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
      valign: 'middle',
      overflow: 'visible',
      minCellHeight: 10,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [48, 55, 64],
      halign: 'left',
      valign: 'top',
      overflow: 'linebreak',
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      0: { cellWidth: 30, halign: 'left' },
      1: { cellWidth: 24, halign: 'left' },
      2: { cellWidth: 26, halign: 'left', overflow: 'visible' },
      3: { cellWidth: 102, halign: 'left', overflow: 'linebreak' },
    },
    didParseCell: (hook) => {
      if (hook.section === 'head') {
        hook.cell.styles.overflow = 'visible';
        if (hook.column.index === 2) {
          hook.cell.styles.minCellWidth = 26;
        }
      }
      if (hook.section === 'body') {
        hook.cell.styles.halign = 'left';
        hook.cell.styles.overflow = hook.column.index === 3 ? 'linebreak' : 'visible';
      }
    },
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
    student.gender === 'boy' ? 'Gender: Boy' : student.gender === 'girl' ? 'Gender: Girl' : null,
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
      1: { cellWidth: 26, halign: 'left' },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 16, halign: 'left' },
      4: { cellWidth: 22, halign: 'left' },
      5: { cellWidth: 10, halign: 'center' },
      6: { cellWidth: 20, halign: 'left' },
      7: { cellWidth: 20, halign: 'left' },
      8: { cellWidth: 18, halign: 'left' },
      9: { cellWidth: 14, halign: 'center' },
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
  const pageHeight = doc.internal.pageSize.getHeight();
  const numbered = getDailyNumberedNames(session);
  let y = startY;
  let offset = 0;

  const drawPageGrid = (pageNames: string[], namesPerColumn: number, atY: number) => {
    const { headers, rows } = buildDailyNameGridPage(pageNames, namesPerColumn);
    autoTable(doc, {
      startY: atY,
      theme: 'plain',
      head: [headers],
      body: rows,
      margin: { left: 14, right: 14, bottom: DAILY_PDF_BOTTOM_MARGIN_MM },
      // We paginate ourselves — do not let autoTable split mid-grid.
      pageBreak: 'avoid',
      rowPageBreak: 'avoid',
      styles: {
        cellPadding: { top: 3, right: 3, bottom: 3, left: 4 },
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
        minCellHeight: 10,
        halign: 'left',
      },
      didDrawPage: () => {
        const currentPage = doc.getNumberOfPages();
        pageContexts.set(currentPage, { dateLabel, stats });
      },
    });
    return (doc as JsPdfWithTable).lastAutoTable.finalY + 8;
  };

  if (numbered.length === 0) {
    y = drawPageGrid([], Math.min(3, DAILY_ATTENDANCE_NAMES_PER_COLUMN), y);
  } else {
    while (offset < numbered.length) {
      let rowsFit = dailyNameRowsThatFit(pageHeight - DAILY_PDF_BOTTOM_MARGIN_MM - y);

      // Not enough room for a useful block — start a fresh page.
      if (rowsFit < 3) {
        doc.addPage();
        y = DAILY_PDF_TOP_MARGIN_MM;
        rowsFit = dailyNameRowsThatFit(pageHeight - DAILY_PDF_BOTTOM_MARGIN_MM - y);
      }

      const namesPerColumn = Math.max(
        1,
        Math.min(DAILY_ATTENDANCE_NAMES_PER_COLUMN, rowsFit || DAILY_ATTENDANCE_NAMES_PER_COLUMN),
      );
      const capacity = namesPerColumn * DAILY_ATTENDANCE_NAME_COLUMN_COUNT;
      const pageNames = numbered.slice(offset, offset + capacity);

      y = drawPageGrid(pageNames, namesPerColumn, y);
      offset += pageNames.length;

      // More names remain → next page for the next full block.
      if (offset < numbered.length) {
        doc.addPage();
        y = DAILY_PDF_TOP_MARGIN_MM;
      }
    }
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
  buildYearDoc(yearData: YearData, students: Student[] = [], options: PdfExportOptions = {}): jsPDF {
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
    return doc;
  },

  exportYear(yearData: YearData, students: Student[] = [], options: PdfExportOptions = {}) {
    this.buildYearDoc(yearData, students, options).save(`attendance_${yearData.year}.pdf`);
  },

  getYearBlobUrl(yearData: YearData, students: Student[] = [], options: PdfExportOptions = {}) {
    return String(this.buildYearDoc(yearData, students, options).output('bloburl'));
  },

  buildMonthDoc(monthData: MonthData, options: PdfExportOptions = {}): jsPDF {
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
    return doc;
  },

  exportMonth(monthData: MonthData, options: PdfExportOptions = {}) {
    const mName = monthName(monthData.month);
    this.buildMonthDoc(monthData, options).save(`attendance_${mName}_${monthData.year}.pdf`);
  },

  getMonthBlobUrl(monthData: MonthData, options: PdfExportOptions = {}) {
    return String(this.buildMonthDoc(monthData, options).output('bloburl'));
  },

  buildSundayDoc(
    session: SundaySession,
    _year: number,
    _month: number,
    options: PdfExportOptions = {},
  ): jsPDF {
    const includeStudentTables = options.includeStudentTables ?? true;
    const doc = new jsPDF();
    const pageContexts = new Map<number, DayPageContext>();
    const stats = getSessionStats(session);
    const dateLabel = format(session.date, 'EEEE, dd MMM yyyy');

    addHeader(
      doc,
      'Attendance Report',
      `${format(session.date, 'EEEE, dd MMM yyyy')}`,
    );

    let y = 36;
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

    y = buildActivitiesBlock(
      doc,
      y,
      session.activities.map((activity) => ({ activity })),
    );

    pageContexts.set(1, { dateLabel, stats });
    addFooters(doc, pageContexts);
    return doc;
  },

  exportSunday(session: SundaySession, year: number, month: number, options: PdfExportOptions = {}) {
    const mName = monthName(month);
    this.buildSundayDoc(session, year, month, options).save(
      `attendance_${format(session.date, 'dd-MMM-yyyy')}_${mName}_${year}.pdf`,
    );
  },

  getSundayBlobUrl(
    session: SundaySession,
    year: number,
    month: number,
    options: PdfExportOptions = {},
  ) {
    return String(this.buildSundayDoc(session, year, month, options).output('bloburl'));
  },

  buildStudentReportDoc(report: StudentAttendanceReport): jsPDF {
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
        ['Gender', report.student.gender === 'boy' ? 'Boy' : report.student.gender === 'girl' ? 'Girl' : '-'],
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
    return doc;
  },

  exportStudentReport(report: StudentAttendanceReport) {
    const safeName = report.student.name.replace(/\s+/g, '_');
    this.buildStudentReportDoc(report).save(
      `student_${safeName}_${report.scopeLabel.replace(/\s+/g, '_')}.pdf`,
    );
  },

  getStudentReportBlobUrl(report: StudentAttendanceReport) {
    return String(this.buildStudentReportDoc(report).output('bloburl'));
  },

  /** Full master list of all saints with complete profile + attendance data (landscape). */
  buildAllSaintsListDoc(entries: StudentListEntry[]): jsPDF {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const total = entries.length;
    const withAttendance = entries.filter((e) => e.totalSessions > 0).length;
    // Hidden from subtitle: avg rate
    // const avgRate =
    //   total === 0 ? 0 : entries.reduce((sum, e) => sum + e.rate, 0) / total;

    addHeader(
      doc,
      'All Saints Master List',
      `${total} saints • ${withAttendance} with attendance`,
      // `${total} saints • ${withAttendance} with attendance • Avg rate ${avgRate.toFixed(0)}%`,
    );

    let y = 34;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(
      'Complete saints data: profile details and attendance summary for every unique saint.',
      14,
      y,
    );
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [[
        '#',
        'Name',
        'Class',
        'Phone',
        'Age',
        'Address',
        // Hidden columns:
        // 'Sanchalan Sewa',
        // 'Stage Sewa',
        'Sessions',
        'Present',
        // 'Came',
        // 'Absent',
        // 'Late',
        // 'Excused',
        // 'Rate',
      ]],
      body: entries.map((entry, i) => {
        const s = entry.student;
        return [
          String(i + 1),
          formatPdfCellText(s.name),
          formatPdfCellText(s.grade),
          formatPdfCellText(s.phone),
          s.age != null ? String(s.age) : '-',
          formatPdfCellText(s.address),
          // formatPdfCellText(s.sanchalanSewa),
          // formatPdfCellText(s.stageSewa),
          String(entry.totalSessions),
          String(entry.present),
          // String(entry.cameDays),
          // String(entry.absent),
          // String(entry.late),
          // String(entry.excused),
          // `${entry.rate.toFixed(0)}%`,
        ];
      }),
      margin: { left: 10, right: 10, bottom: 18 },
      styles: {
        font: 'helvetica',
        fontSize: 8,
        halign: 'left',
        valign: 'middle',
        overflow: 'linebreak',
        cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
      },
      headStyles: {
        fillColor: [30, 58, 95],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left',
        overflow: 'linebreak',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [48, 55, 64],
      },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 42 },
        2: { cellWidth: 28 },
        3: { cellWidth: 32 },
        4: { cellWidth: 16, halign: 'center' },
        5: { cellWidth: 70 },
        6: { cellWidth: 24, halign: 'center' },
        7: { cellWidth: 24, halign: 'center' },
        // Hidden column widths (restore with columns above):
        // 6: { cellWidth: 24 }, // Sanchalan Sewa
        // 7: { cellWidth: 22 }, // Stage Sewa
        // 8: { cellWidth: 14, halign: 'center' }, // Sessions
        // 9: { cellWidth: 14, halign: 'center' }, // Present
        // 10: { cellWidth: 12, halign: 'center' }, // Came
        // 11: { cellWidth: 14, halign: 'center' }, // Absent
        // 12: { cellWidth: 12, halign: 'center' }, // Late
        // 13: { cellWidth: 14, halign: 'center' }, // Excused
        // 14: { cellWidth: 12, halign: 'center' }, // Rate
      },
    });

    addFooters(doc);
    return doc;
  },

  exportAllSaintsList(entries: StudentListEntry[]) {
    const doc = this.buildAllSaintsListDoc(entries);
    doc.save(`all_saints_master_list_${format(new Date(), 'dd-MMM-yyyy')}.pdf`);
  },

  getAllSaintsListBlobUrl(entries: StudentListEntry[]): string {
    const doc = this.buildAllSaintsListDoc(entries);
    return String(doc.output('bloburl'));
  },
};