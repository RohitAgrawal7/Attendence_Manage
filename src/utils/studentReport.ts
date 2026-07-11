import type { AttendanceStatus, Student, SundaySession, YearData } from '../types';
import { ATTENDANCE_STATUS_MAP } from '../types';
import { sessionLabel } from './sundayHelpers';

export interface StudentDayRecord {
  date: Date;
  year: number;
  month: number;
  label: string;
  topic?: string;
  status: AttendanceStatus;
}

export interface StudentAttendanceReport {
  student: Student;
  scopeLabel: string;
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  cameDays: number;
  rate: number;
  days: StudentDayRecord[];
}

export type ReportScope =
  | { type: 'all' }
  | { type: 'year'; year: number }
  | { type: 'month'; year: number; month: number }
  | { type: 'session'; year: number; month: number; date: Date };

function matchesScope(
  session: SundaySession,
  scope: ReportScope,
): boolean {
  const y = session.date.getFullYear();
  const m = session.date.getMonth() + 1;

  if (scope.type === 'all') return true;
  if (scope.type === 'year') return y === scope.year;
  if (scope.type === 'month') return y === scope.year && m === scope.month;
  if (scope.type === 'session') {
    return (
      y === scope.year &&
      m === scope.month &&
      session.date.getDate() === scope.date.getDate() &&
      session.date.getMonth() === scope.date.getMonth() &&
      session.date.getFullYear() === scope.date.getFullYear()
    );
  }
  return false;
}

export function collectStudentDayRecords(
  years: YearData[],
  studentId: string,
  scope: ReportScope,
): StudentDayRecord[] {
  const records: StudentDayRecord[] = [];

  for (const yearData of years) {
    for (const monthData of yearData.months) {
      for (const session of monthData.sundays) {
        if (!matchesScope(session, scope)) continue;

        const attendance = session.attendance.find((a) => a.student.id === studentId);
        if (!attendance) continue;

        records.push({
          date: session.date,
          year: session.date.getFullYear(),
          month: session.date.getMonth() + 1,
          label: sessionLabel(session.date),
          topic: session.topic,
          status: attendance.status,
        });
      }
    }
  }

  return records.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function buildStudentReport(
  student: Student,
  years: YearData[],
  scope: ReportScope,
  scopeLabel: string,
): StudentAttendanceReport {
  const days = collectStudentDayRecords(years, student.id, scope);
  const present = days.filter((d) => d.status === 'present').length;
  const absent = days.filter((d) => d.status === 'absent').length;
  const late = days.filter((d) => d.status === 'late').length;
  const excused = days.filter((d) => d.status === 'excused').length;
  const cameDays = present + late;
  const totalDays = days.length;

  return {
    student,
    scopeLabel,
    totalDays,
    present,
    absent,
    late,
    excused,
    cameDays,
    rate: totalDays === 0 ? 0 : (cameDays / totalDays) * 100,
    days,
  };
}

export function formatStudentReportText(report: StudentAttendanceReport): string {
  const { student, scopeLabel, totalDays, present, absent, late, excused, cameDays, rate, days } = report;

  const lines = [
    `STUDENT ATTENDANCE REPORT`,
    `Scope: ${scopeLabel}`,
    ``,
    `Name: ${student.name}`,
    student.grade ? `Class: ${student.grade}` : null,
    student.phone ? `Phone: ${student.phone}` : null,
    student.address ? `Address: ${student.address}` : null,
    student.age != null ? `Age: ${student.age}` : null,
    student.sanchalanSewa ? `Sanchalan Sewa: ${student.sanchalanSewa}` : null,
    student.stageSewa ? `Stage Sewa: ${student.stageSewa}` : null,
    ``,
    `SUMMARY`,
    `Total Sessions: ${totalDays}`,
    `Days Present: ${present}`,
    `Days Came (Present + Late): ${cameDays}`,
    `Absent: ${absent}`,
    `Late: ${late}`,
    `Excused: ${excused}`,
    `Attendance Rate: ${rate.toFixed(0)}%`,
    ``,
    `DAY-BY-DAY`,
    ...days.map(
      (d) =>
        `${d.label} — ${d.date.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}: ${ATTENDANCE_STATUS_MAP[d.status].label}${d.topic ? ` (Topic: ${d.topic})` : ''}`,
    ),
  ].filter(Boolean);

  return lines.join('\n');
}

export interface StudentSummaryRow {
  student: Student;
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  cameDays: number;
  rate: number;
}

export function buildAllStudentsSummary(
  years: YearData[],
  scope: ReportScope,
  students: Student[],
): StudentSummaryRow[] {
  return students
    .map((student) => {
      const report = buildStudentReport(student, years, scope, '');
      return {
        student,
        totalDays: report.totalDays,
        present: report.present,
        absent: report.absent,
        late: report.late,
        excused: report.excused,
        cameDays: report.cameDays,
        rate: report.rate,
      };
    })
    .filter((row) => row.totalDays > 0)
    .sort((a, b) => a.student.name.localeCompare(b.student.name));
}
