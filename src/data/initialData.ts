import type {
  Activity,
  AttendanceRecord,
  AttendanceStatus,
  MonthData,
  Student,
  SundaySession,
  YearData,
} from '../types';
import { createEmptySession } from '../utils/sundayHelpers';

const SAMPLE_TOPICS = [
  'Leadership & Teamwork',
  'Environmental Awareness',
  'Career Guidance',
  'Health & Wellness',
];

const STATUSES: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];

const INITIAL_STUDENTS: Student[] = [
  { id: '1', name: 'Aarav Sharma', grade: 'Grade 10', rollNumber: '101', phone: '9876543210', address: 'Mumbai', age: 16 },
  { id: '2', name: 'Priya Patel', grade: 'Grade 10', rollNumber: '102', phone: '9876543211', address: 'Delhi', age: 16 },
  { id: '3', name: 'Rohan Mehta', grade: 'Grade 11', rollNumber: '201', phone: '9876543212', address: 'Pune', age: 17 },
  { id: '4', name: 'Sneha Reddy', grade: 'Grade 11', rollNumber: '202', phone: '9876543213', address: 'Hyderabad', age: 17 },
  { id: '5', name: 'Arjun Singh', grade: 'Grade 12', rollNumber: '301', phone: '9876543214', address: 'Jaipur', age: 18 },
  { id: '6', name: 'Kavya Nair', grade: 'Grade 12', rollNumber: '302', phone: '9876543215', address: 'Kochi', age: 18 },
  { id: '7', name: 'Vikram Joshi', grade: 'Grade 10', rollNumber: '103', phone: '9876543216', address: 'Ahmedabad', age: 16 },
  { id: '8', name: 'Ananya Iyer', grade: 'Grade 11', rollNumber: '203', phone: '9876543217', address: 'Chennai', age: 17 },
];

function generateSundaysForMonth(year: number, month: number, students: Student[]): SundaySession[] {
  const sundays: SundaySession[] = [];
  let date = new Date(year, month - 1, 1);
  let weekNumber = 1;

  while (date.getMonth() === month - 1 && weekNumber <= 4) {
    const daysUntilSunday = (7 - date.getDay()) % 7;
    const sundayDate = new Date(date);
    sundayDate.setDate(date.getDate() + daysUntilSunday);

    if (sundayDate.getMonth() === month - 1) {
      sundays.push(createSundaySession(weekNumber, sundayDate, students));
      weekNumber++;
      date = new Date(sundayDate);
      date.setDate(date.getDate() + 7);
    } else {
      date = new Date(date);
      date.setDate(date.getDate() + 1);
    }
  }

  return sundays;
}

function createSundaySession(weekNumber: number, date: Date, students: Student[]): SundaySession {
  const attendance: AttendanceRecord[] = students.map((student, index) => {
    const status = STATUSES[index % 4 === 0 ? 1 : index % 3];
    return {
      student,
      status,
      notes: status === 'absent' ? 'Not informed' : undefined,
    };
  });

  return {
    weekNumber,
    date,
    attendance,
    activities: sampleActivities(weekNumber),
    topic: SAMPLE_TOPICS[weekNumber % SAMPLE_TOPICS.length],
  };
}

function sampleActivities(weekNumber: number): Activity[] {
  const base: Activity[] = [
    {
      id: `a${weekNumber}_1`,
      title: 'Morning Assembly',
      description: 'Prayer, announcements, and flag hoisting',
      category: 'Physical Activity',
      durationMinutes: 30,
    },
    {
      id: `a${weekNumber}_2`,
      title: 'Group Discussion',
      description: 'Topic-based student discussion in groups',
      category: 'Mental Activity',
      durationMinutes: 45,
    },
    {
      id: `a${weekNumber}_3`,
      title: 'Sports Activity',
      description: 'Outdoor games and physical fitness',
      category: 'Sewadal',
      durationMinutes: 60,
    },
  ];

  if (weekNumber % 2 === 0) {
    base.push({
      id: `a${weekNumber}_4`,
      title: 'Cultural Program',
      description: 'Music, dance, and drama performances',
      category: 'Volunteers',
      durationMinutes: 90,
    });
  }

  return base;
}

export function generateInitialData(): { students: Student[]; years: YearData[] } {
  const students = INITIAL_STUDENTS.map((s) => ({ ...s }));
  const now = new Date();
  const currentYear = now.getFullYear();
  const years: YearData[] = [];

  for (let y = currentYear - 1; y <= currentYear; y++) {
    const months: MonthData[] = [];

    for (let m = 1; m <= 12; m++) {
      const sundays = generateSundaysForMonth(y, m, students);
      if (sundays.length > 0) {
        months.push({ month: m, year: y, sundays });
      }
    }

    if (months.length > 0) {
      years.push({ year: y, months });
    }
  }

  return { students, years: years.reverse() };
}

export { createEmptySession };
