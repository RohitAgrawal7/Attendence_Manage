import type { AttendanceStatus, Student } from '../../types';
import { genderLabel } from '../../utils/stats';
import { statusBadgeStyle, statusLabel, type StudentTableRow } from '../../utils/studentTable';

interface StudentAttendanceTableProps {
  rows: StudentTableRow[];
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  statusOverride?: (student: Student) => string;
}

export function StudentAttendanceTable({
  rows,
  title,
  subtitle,
  emptyMessage = 'No student data recorded',
  statusOverride,
}: StudentAttendanceTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {(title || subtitle) && (
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-3 sm:px-5">
          {title && <p className="font-semibold text-primary">{title}</p>}
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1020px] text-left text-sm">
          <thead>
            <tr className="bg-[#1e3a5f] text-xs font-semibold uppercase tracking-wide text-white">
              <th className="px-3 py-3 sm:px-4">#</th>
              <th className="px-3 py-3 sm:px-4">Name</th>
              <th className="px-3 py-3 sm:px-4">Gender</th>
              <th className="px-3 py-3 sm:px-4">Class</th>
              <th className="px-3 py-3 sm:px-4">Phone</th>
              <th className="px-3 py-3 sm:px-4">Age</th>
              <th className="px-3 py-3 sm:px-4">Address</th>
              <th className="px-3 py-3 sm:px-4">Sanchalan Sewa</th>
              <th className="px-3 py-3 sm:px-4">Stage Sewa</th>
              <th className="px-3 py-3 sm:px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-sm text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => {
                const statusText = statusOverride
                  ? statusOverride(row.student)
                  : statusLabel(row.status);
                const badgeStyle = statusOverride
                  ? { backgroundColor: '#e8eef5', color: '#1e3a5f' }
                  : statusBadgeStyle(row.status);

                return (
                  <tr
                    key={`${row.student.id}-${index}`}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/80'}
                  >
                    <td className="px-3 py-3 text-gray-400 sm:px-4">{index + 1}</td>
                    <td className="px-3 py-3 font-medium text-gray-900 sm:px-4">{row.student.name}</td>
                    <td className="px-3 py-3 text-gray-700 sm:px-4">{genderLabel(row.student.gender)}</td>
                    <td className="px-3 py-3 text-gray-700 sm:px-4">{row.student.grade ?? '—'}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-gray-700 sm:px-4">
                      {row.student.phone ?? '—'}
                    </td>
                    <td className="px-3 py-3 text-gray-700 sm:px-4">
                      {row.student.age != null ? row.student.age : '—'}
                    </td>
                    <td className="px-3 py-3 text-gray-700 sm:px-4">{row.student.address ?? '—'}</td>
                    <td className="px-3 py-3 text-gray-700 sm:px-4">{row.student.sanchalanSewa ?? '—'}</td>
                    <td className="px-3 py-3 text-gray-700 sm:px-4">{row.student.stageSewa ?? '—'}</td>
                    <td className="px-3 py-3 sm:px-4">
                      <span
                        className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={badgeStyle}
                      >
                        {statusText}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface MasterStudentRow {
  student: Student;
  statusText: string;
}

export function MasterStudentTable({
  rows,
  title = 'All Saints',
  subtitle,
}: {
  rows: MasterStudentRow[];
  title?: string;
  subtitle?: string;
}) {
  const tableRows: StudentTableRow[] = rows.map((row) => ({
    student: row.student,
    status: 'present' as AttendanceStatus,
  }));

  return (
    <StudentAttendanceTable
      rows={tableRows}
      title={title}
      subtitle={subtitle}
      statusOverride={(student) => rows.find((r) => r.student.id === student.id)?.statusText ?? '—'}
    />
  );
}
