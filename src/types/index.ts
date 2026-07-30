export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceStatusInfo {
  label: string;
  shortCode: string;
}

export const ATTENDANCE_STATUS_MAP: Record<AttendanceStatus, AttendanceStatusInfo> = {
  present: { label: 'Present', shortCode: 'P' },
  absent: { label: 'Absent', shortCode: 'A' },
  late: { label: 'Late', shortCode: 'L' },
  excused: { label: 'Excused', shortCode: 'E' },
};

export interface Student {
  id: string;
  name: string;
  grade?: string;
  rollNumber?: string;
  phone?: string;
  address?: string;
  age?: number;
  gender?: 'boy' | 'girl';
  sanchalanSewa?: string;
  stageSewa?: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  category: string;
  durationMinutes?: number;
}

export interface AttendanceRecord {
  student: Student;
  status: AttendanceStatus;
  notes?: string;
}

export interface SundaySession {
  weekNumber: number;
  date: Date;
  attendance: AttendanceRecord[];
  activities: Activity[];
  topic?: string;
}

export interface MonthData {
  month: number;
  year: number;
  sundays: SundaySession[];
}

export interface MonthFile {
  id: string;
  year: number;
  month: number;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface YearData {
  year: number;
  months: MonthData[];
}

export interface AttendanceFormInput {
  studentId?: string;
  name: string;
  phone?: string;
  address?: string;
  age?: number;
  grade?: string;
  gender?: 'boy' | 'girl';
  sanchalanSewa?: string;
  stageSewa?: string;
  status?: AttendanceStatus;
  topic?: string;
  date: Date;
}

export interface SessionDateInput {
  year: number;
  month: number;
  date: Date;
}

export interface ActivityFormInput {
  id?: string;
  title: string;
  description: string;
  category: string;
  durationMinutes?: number;
  year: number;
  month: number;
  date: Date;
}

export interface DeleteActivityInput extends SessionDateInput {
  activityId: string;
}

export interface PatchAttendanceInput {
  studentId: string;
  year: number;
  month: number;
  date: Date;
  patch: {
    name?: string;
    phone?: string;
    address?: string;
    grade?: string;
    age?: number;
    gender?: 'boy' | 'girl';
    sanchalanSewa?: string;
    stageSewa?: string;
    status?: AttendanceStatus;
  };
}

export interface UpdateStudentInput {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  grade?: string;
  age?: number;
  gender?: 'boy' | 'girl';
  rollNumber?: string;
  sanchalanSewa?: string;
  stageSewa?: string;
}

export interface AttendanceActionResult {
  year: number;
  month: number;
  dateKey: string;
  weekNumber: number;
  studentId: string;
  studentName: string;
  isUpdate: boolean;
}

export interface DeleteAttendanceInput {
  studentId: string;
  year: number;
  month: number;
  date: Date;
}

export interface EditTarget {
  studentId: string;
  year: number;
  month: number;
  date: Date;
}

export interface DataPdfEntry {
  id: string;
  name: string;
  topics: string[];
  description?: string;
  isCustom?: boolean;
}

export interface TrashItem {
  id: string;
  type: 'session' | 'month_file';
  label: string;
  year?: number;
  month?: number;
  dateKey?: string;
  deletedAt: string;
  expiresAt: string;
  daysRemaining: number;
  detail?: string;
}
