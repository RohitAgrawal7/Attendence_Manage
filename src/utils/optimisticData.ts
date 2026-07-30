import type {
  AttendanceFormInput,
  AttendanceRecord,
  AttendanceStatus,
  PatchAttendanceInput,
  Student,
  SundaySession,
  YearData,
} from '../types';
import { getSundayWeekNumber, sameDay, toDateKey } from './sundayHelpers';

function upsertMonthSession(
  years: YearData[],
  year: number,
  month: number,
  date: Date,
  mutate: (session: SundaySession) => SundaySession,
): YearData[] {
  const dateKey = toDateKey(date);
  let yearData = years.find((y) => y.year === year);
  if (!yearData) {
    yearData = { year, months: [] };
    years = [...years, yearData].sort((a, b) => b.year - a.year);
  }

  return years.map((y) => {
    if (y.year !== year) return y;
    let months = y.months;
    let monthData = months.find((m) => m.month === month);
    if (!monthData) {
      monthData = { month, year, sundays: [] };
      months = [...months, monthData].sort((a, b) => a.month - b.month);
    }

    return {
      ...y,
      months: months.map((m) => {
        if (m.month !== month) return m;
        let sundays = [...m.sundays];
        const idx = sundays.findIndex((s) => toDateKey(s.date) === dateKey);
        if (idx >= 0) {
          sundays[idx] = mutate(sundays[idx]);
        } else {
          const created: SundaySession = {
            weekNumber: getSundayWeekNumber(date),
            date: new Date(date),
            attendance: [],
            activities: [],
            topic: undefined,
          };
          sundays.push(mutate(created));
          sundays.sort((a, b) => a.date.getTime() - b.date.getTime());
        }
        return { ...m, sundays };
      }),
    };
  });
}

function mergeStudent(list: Student[], student: Student): Student[] {
  const idx = list.findIndex((s) => s.id === student.id);
  if (idx < 0) {
    return [...list, student].sort((a, b) => a.name.localeCompare(b.name));
  }
  const next = [...list];
  next[idx] = { ...next[idx], ...student };
  return next;
}

export function applyAttendanceOptimistic(
  years: YearData[],
  students: Student[],
  input: AttendanceFormInput,
  studentId: string,
): { years: YearData[]; students: Student[] } {
  const student: Student = {
    id: studentId,
    name: input.name.trim(),
    phone: input.phone,
    address: input.address,
    age: input.age,
    grade: input.grade,
    gender: input.gender,
    sanchalanSewa: input.sanchalanSewa,
    stageSewa: input.stageSewa,
  };

  const year = input.date.getFullYear();
  const month = input.date.getMonth() + 1;
  const status = (input.status ?? 'present') as AttendanceStatus;

  const nextYears = upsertMonthSession(years, year, month, input.date, (session) => {
    const attendance = [...session.attendance];
    const existing = attendance.findIndex((a) => a.student.id === studentId);
    const record: AttendanceRecord = { student, status };
    if (existing >= 0) attendance[existing] = record;
    else attendance.push(record);
    return {
      ...session,
      topic: input.topic?.trim() || session.topic,
      attendance,
    };
  });

  return {
    years: nextYears,
    students: mergeStudent(students, student),
  };
}

export function applyPatchOptimistic(
  years: YearData[],
  students: Student[],
  input: PatchAttendanceInput,
): { years: YearData[]; students: Student[] } {
  const { patch } = input;
  let nextStudents = students;
  const student = students.find((s) => s.id === input.studentId);
  if (student) {
    const updated: Student = {
      ...student,
      name: patch.name?.trim() || student.name,
      phone: patch.phone !== undefined ? patch.phone : student.phone,
      address: patch.address !== undefined ? patch.address : student.address,
      grade: patch.grade !== undefined ? patch.grade : student.grade,
      age: patch.age !== undefined ? patch.age : student.age,
      gender: patch.gender !== undefined ? patch.gender : student.gender,
      sanchalanSewa:
        patch.sanchalanSewa !== undefined ? patch.sanchalanSewa : student.sanchalanSewa,
      stageSewa: patch.stageSewa !== undefined ? patch.stageSewa : student.stageSewa,
    };
    nextStudents = mergeStudent(students, updated);
  }

  const nextYears = upsertMonthSession(
    years,
    input.year,
    input.month,
    input.date,
    (session) => ({
      ...session,
      attendance: session.attendance.map((a) => {
        if (a.student.id !== input.studentId) return a;
        const mergedStudent = nextStudents.find((s) => s.id === input.studentId) ?? a.student;
        return {
          ...a,
          student: mergedStudent,
          status: (patch.status as AttendanceStatus) ?? a.status,
        };
      }),
    }),
  );

  return { years: nextYears, students: nextStudents };
}

export function applyTopicOptimistic(
  years: YearData[],
  year: number,
  month: number,
  date: Date,
  topic: string,
): YearData[] {
  return upsertMonthSession(years, year, month, date, (session) => ({
    ...session,
    topic,
  }));
}

export function removeAttendanceOptimistic(
  years: YearData[],
  studentId: string,
  year: number,
  month: number,
  date: Date,
): YearData[] {
  return years.map((y) => {
    if (y.year !== year) return y;
    return {
      ...y,
      months: y.months.map((m) => {
        if (m.month !== month) return m;
        return {
          ...m,
          sundays: m.sundays.map((s) => {
            if (!sameDay(s.date, date)) return s;
            return {
              ...s,
              attendance: s.attendance.filter((a) => a.student.id !== studentId),
            };
          }),
        };
      }),
    };
  });
}
