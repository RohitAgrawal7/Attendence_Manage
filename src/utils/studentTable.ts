import type { AttendanceRecord, AttendanceStatus, Student, SundaySession } from '../types';
import { ATTENDANCE_STATUS_MAP } from '../types';
import { statusColor } from './stats';

export interface StudentTableRow {
  student: Student;
  status: AttendanceStatus;
}

export function sessionToTableRows(session: SundaySession): StudentTableRow[] {
  return [...session.attendance]
    .sort((a, b) => a.student.name.localeCompare(b.student.name))
    .map((record) => ({
      student: record.student,
      status: record.status,
    }));
}

export function recordsToTableRows(records: AttendanceRecord[]): StudentTableRow[] {
  return [...records]
    .sort((a, b) => a.student.name.localeCompare(b.student.name))
    .map((record) => ({
      student: record.student,
      status: record.status,
    }));
}

export function statusLabel(status: AttendanceStatus): string {
  return ATTENDANCE_STATUS_MAP[status].label;
}

export function statusBadgeStyle(status: AttendanceStatus) {
  const color = statusColor(status);
  return {
    backgroundColor: `${color}18`,
    color,
  };
}
