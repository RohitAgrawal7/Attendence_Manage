import type {
  ActivityFormInput,
  AttendanceActionResult,
  AttendanceFormInput,
  DeleteActivityInput,
  DeleteAttendanceInput,
  PatchAttendanceInput,
  SessionDateInput,
  Student,
  UpdateStudentInput,
  YearData,
} from '../types';
import { parseDateKey, toDateKey } from '../utils/sundayHelpers';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> | undefined),
  };
  const apiKey = import.meta.env.VITE_API_KEY as string | undefined;
  if (apiKey) headers['x-api-key'] = apiKey;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      'Cannot reach the API. Start the backend and confirm VITE_API_URL / proxy settings.',
    );
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface BootstrapData {
  students: Student[];
  years: YearData[];
}

function normalizeBootstrap(data: BootstrapData): BootstrapData {
  return {
    students: data.students,
    years: data.years.map((y) => ({
      ...y,
      months: y.months.map((m) => ({
        ...m,
        sundays: m.sundays.map((s) => ({
          ...s,
          // Parse YYYY-MM-DD as local calendar date (avoid UTC midnight shift)
          date: parseDateKey(typeof s.date === 'string' ? s.date : toDateKey(new Date(s.date))),
        })),
      })),
    })),
  };
}

export const api = {
  async getBootstrap(): Promise<BootstrapData> {
    const data = await request<BootstrapData>('/api/bootstrap');
    return normalizeBootstrap(data);
  },

  async saveAttendance(input: AttendanceFormInput): Promise<AttendanceActionResult> {
    return request('/api/attendance', {
      method: 'POST',
      body: JSON.stringify({
        ...input,
        date: toDateKey(input.date),
      }),
    });
  },

  async patchAttendance(input: PatchAttendanceInput): Promise<void> {
    await request(`/api/sessions/${toDateKey(input.date)}/attendance/${input.studentId}`, {
      method: 'PATCH',
      body: JSON.stringify(input.patch),
    });
  },

  async deleteAttendance(input: DeleteAttendanceInput): Promise<void> {
    await request(`/api/sessions/${toDateKey(input.date)}/attendance/${input.studentId}`, {
      method: 'DELETE',
    });
  },

  async updateSessionTopic(input: SessionDateInput & { topic: string }): Promise<void> {
    await request(`/api/sessions/${toDateKey(input.date)}/topic`, {
      method: 'PATCH',
      body: JSON.stringify({ topic: input.topic }),
    });
  },

  async saveActivity(input: ActivityFormInput): Promise<void> {
    await request(`/api/sessions/${toDateKey(input.date)}/activities`, {
      method: 'POST',
      body: JSON.stringify({
        id: input.id,
        title: input.title,
        description: input.description,
        category: input.category,
        durationMinutes: input.durationMinutes,
      }),
    });
  },

  async deleteActivity(input: DeleteActivityInput): Promise<void> {
    await request(`/api/sessions/${toDateKey(input.date)}/activities/${input.activityId}`, {
      method: 'DELETE',
    });
  },

  async getStudentsWithStats() {
    return request('/api/students?includeStats=true');
  },

  async updateStudent(input: UpdateStudentInput): Promise<Student> {
    return request(`/api/students/${input.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: input.name,
        phone: input.phone,
        address: input.address,
        grade: input.grade,
        age: input.age,
        gender: input.gender,
        rollNumber: input.rollNumber,
        sanchalanSewa: input.sanchalanSewa,
        stageSewa: input.stageSewa,
      }),
    });
  },

  async deleteStudent(id: string) {
    return request<{ deleted: boolean; studentId: string; attendanceRecordsRemoved: number }>(
      `/api/students/${id}`,
      { method: 'DELETE' },
    );
  },

  async getMonthFiles(year: number, month: number) {
    return request<import('../types').MonthFile[]>(`/api/months/${year}/${month}/files`);
  },

  async uploadMonthFile(year: number, month: number, file: File) {
    const form = new FormData();
    form.append('file', file);
    const headers: Record<string, string> = {};
    const apiKey = import.meta.env.VITE_API_KEY as string | undefined;
    if (apiKey) headers['x-api-key'] = apiKey;
    const res = await fetch(`${API_BASE}/api/months/${year}/${month}/files`, {
      method: 'POST',
      headers,
      body: form,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Upload failed (${res.status})`);
    }
    return res.json() as Promise<import('../types').MonthFile>;
  },

  async deleteMonthFile(year: number, month: number, fileId: string) {
    await request(`/api/months/${year}/${month}/files/${fileId}`, { method: 'DELETE' });
  },

  monthFileViewUrl(year: number, month: number, fileId: string) {
    return `${API_BASE}/api/months/${year}/${month}/files/${fileId}/view`;
  },

  monthFileDownloadUrl(year: number, month: number, fileId: string) {
    return `${API_BASE}/api/months/${year}/${month}/files/${fileId}/download`;
  },

  async deleteSession(dateKey: string) {
    await request(`/api/sessions/${dateKey}`, { method: 'DELETE' });
  },

  async deleteMonth(year: number, month: number) {
    return request<{ movedToTrash: boolean; sessions: number; files: number }>(
      `/api/months/${year}/${month}`,
      { method: 'DELETE' },
    );
  },

  async getTrash() {
    return request<import('../types').TrashItem[]>('/api/trash');
  },

  async restoreTrashSession(dateKey: string) {
    await request(`/api/trash/sessions/${dateKey}/restore`, { method: 'POST' });
  },

  async permanentlyDeleteTrashSession(dateKey: string) {
    await request(`/api/trash/sessions/${dateKey}`, { method: 'DELETE' });
  },

  async restoreTrashFile(id: string) {
    await request(`/api/trash/files/${id}/restore`, { method: 'POST' });
  },

  async permanentlyDeleteTrashFile(id: string) {
    await request(`/api/trash/files/${id}`, { method: 'DELETE' });
  },
};
