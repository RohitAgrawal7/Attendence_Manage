import type { Student } from '../types';

export function normalizeStudentName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Find existing student by id, exact name, or name + phone */
export function findExistingStudent(
  students: Student[],
  input: { name: string; phone?: string; studentId?: string },
): Student | undefined {
  if (input.studentId) {
    return students.find((s) => s.id === input.studentId);
  }

  const nameKey = normalizeStudentName(input.name);
  if (!nameKey) return undefined;

  const byName = students.filter((s) => normalizeStudentName(s.name) === nameKey);
  if (byName.length === 0) return undefined;
  if (byName.length === 1) return byName[0];

  const phone = input.phone?.trim();
  if (phone) {
    const phoneMatch = byName.find((s) => s.phone?.trim() === phone);
    if (phoneMatch) return phoneMatch;
  }

  return byName[0];
}

/** Remove duplicates — one entry per student id, then one per normalized name */
export function getUniqueStudents(students: Student[]): Student[] {
  const byId = new Map<string, Student>();
  const byName = new Map<string, string>();

  for (const student of students) {
    const nameKey = normalizeStudentName(student.name);
    if (!nameKey) continue;

    if (byName.has(nameKey)) {
      const keepId = byName.get(nameKey)!;
      const existing = byId.get(keepId)!;
      byId.set(keepId, mergeStudentData(existing, student));
      continue;
    }

    if (byId.has(student.id)) {
      byId.set(student.id, mergeStudentData(byId.get(student.id)!, student));
    } else {
      byId.set(student.id, student);
    }
    byName.set(nameKey, student.id);
  }

  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function mergeStudentData(primary: Student, secondary: Student): Student {
  return {
    id: primary.id,
    name: primary.name || secondary.name,
    grade: primary.grade ?? secondary.grade,
    rollNumber: primary.rollNumber ?? secondary.rollNumber,
    phone: primary.phone ?? secondary.phone,
    address: primary.address ?? secondary.address,
    age: primary.age ?? secondary.age,
    sanchalanSewa: primary.sanchalanSewa ?? secondary.sanchalanSewa,
    stageSewa: primary.stageSewa ?? secondary.stageSewa,
  };
}

export interface StudentListEntry {
  student: Student;
  totalSessions: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  cameDays: number;
  rate: number;
}

export function buildStudentListEntries(
  students: Student[],
  years: import('../types').YearData[],
): StudentListEntry[] {
  const unique = getUniqueStudents(students);

  return unique.map((student) => {
    let totalSessions = 0;
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    for (const year of years) {
      for (const month of year.months) {
        for (const session of month.sundays) {
          const record = session.attendance.find(
            (a) =>
              a.student.id === student.id ||
              normalizeStudentName(a.student.name) === normalizeStudentName(student.name),
          );
          if (!record) continue;
          totalSessions++;
          if (record.status === 'present') present++;
          else if (record.status === 'absent') absent++;
          else if (record.status === 'late') late++;
          else if (record.status === 'excused') excused++;
        }
      }
    }

    const cameDays = present + late;
    return {
      student,
      totalSessions,
      present,
      absent,
      late,
      excused,
      cameDays,
      rate: totalSessions === 0 ? 0 : (cameDays / totalSessions) * 100,
    };
  });
}
