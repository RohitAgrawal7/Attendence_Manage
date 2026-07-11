import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarCheck, CheckCircle, Percent, ChevronRight, ClipboardList, Trash2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import { pdfService } from '../services/pdfService';
import { Header } from '../components/layout/Header';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { PdfButton } from '../components/ui/PdfButton';
import { ShareMonthReportButton } from '../components/ui/ShareReportButton';
import { StudentReportPanel } from '../components/reports/StudentReportPanel';
import { PageTransition, staggerContainer, staggerItem } from '../components/animations/PageTransition';
import { formatDate, formatDay, monthName } from '../utils/formatters';
import {
  getAttendanceRate,
  getMonthAverageAttendance,
  getMonthTotalPresent,
  getPresentCount,
} from '../utils/stats';
import { isSunday, sessionLabel, toDateKey } from '../utils/sundayHelpers';
import { SessionTopicField } from '../components/ui/SessionTopicField';
import { MonthFilesPanel } from '../components/month/MonthFilesPanel';
import { DataPdfPanel } from '../components/pdf/DataPdfPanel';
import { buildMonthPdfEntries } from '../utils/dataPdfHelpers';
import { StudentDataTablesPanel } from '../components/students/StudentDataTablesPanel';

export function MonthPage() {
  const { year: yearParam, month: monthParam } = useParams<{ year: string; month: string }>();
  const navigate = useNavigate();
  const year = Number(yearParam);
  const month = Number(monthParam);
  const { getMonth, deleteMonth } = useData();
  const monthData = getMonth(year, month);
  const mName = monthName(month);

  if (!monthData) {
    return (
      <PageTransition>
        <Header title="Not Found" />
        <div className="mx-auto max-w-6xl px-4 py-12 text-center text-gray-500">
          Month not found. <Link to="/" className="text-accent underline">Go home</Link>
        </div>
      </PageTransition>
    );
  }

  const sortedSessions = [...monthData.sundays].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  async function handleDeleteMonth() {
    if (
      !confirm(
        `Move all ${mName} ${year} data to Bin?\n\nThis includes ${sortedSessions.length} session(s) and uploaded files. You can restore within 30 days from the Bin page.`,
      )
    ) {
      return;
    }
    try {
      await deleteMonth(year, month);
      navigate(`/year/${year}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete month data');
    }
  }

  return (
    <PageTransition>
      <Header
        title={`${mName} ${year}`}
        actions={
          <div className="flex items-center gap-2">
            <ShareMonthReportButton monthData={monthData} />
            <PdfButton onClick={() => pdfService.exportMonth(monthData)} />
            <button
              type="button"
              onClick={() => void handleDeleteMonth()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-300/40 bg-red-500/20 px-3 py-2 text-xs font-semibold text-white hover:bg-red-500/30 sm:text-sm"
              title="Move month data to Bin"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Delete Month</span>
            </button>
          </div>
        }
      />
      <Breadcrumb
        items={[
          { label: `${year}`, to: `/year/${year}` },
          { label: mName },
        ]}
      />

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-wrap justify-around gap-4 rounded-xl border border-accent/20 bg-accent/5 p-4 sm:p-5">
          {[
            { icon: CalendarCheck, label: 'Sessions', value: `${sortedSessions.length}` },
            { icon: CheckCircle, label: 'Present', value: `${getMonthTotalPresent(monthData)}` },
            { icon: Percent, label: 'Avg', value: `${getMonthAverageAttendance(monthData).toFixed(0)}%` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="text-center">
              <Icon className="mx-auto h-5 w-5 text-accent" />
              <p className="mt-1 text-lg font-bold">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        <StudentReportPanel
          scope={{ type: 'month', year, month }}
          scopeLabel={`${mName} ${year}`}
        />

        <MonthFilesPanel year={year} month={month} monthLabel={mName} />

        <DataPdfPanel
          scopeKey={`month-${year}-${month}`}
          title="Data PDF Names"
          entries={buildMonthPdfEntries(monthData)}
          onExport={(entry) => {
            if (entry.id.startsWith('session-')) {
              const session = monthData.sundays.find(
                (s) => `session-${year}-${month}-${s.weekNumber}` === entry.id,
              );
              if (session) pdfService.exportSunday(session, year, month);
            } else {
              pdfService.exportMonth(monthData);
            }
          }}
        />

        <StudentDataTablesPanel
          sessions={sortedSessions}
          title={`All Student Data — Every Week (${mName} ${year})`}
        />

        <h3 className="text-lg font-bold text-primary">Attendance Sessions</h3>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-3"
        >
          {sortedSessions.map((session) => {
            const present = getPresentCount(session);
            const rate = getAttendanceRate(session);
            const label = sessionLabel(session.date);
            const dateKey = toDateKey(session.date);

            return (
              <motion.div key={dateKey} variants={staggerItem}>
                <div className="card-shadow card-hover overflow-hidden rounded-xl bg-white">
                  <Link
                    to={`/year/${year}/month/${month}/date/${dateKey}`}
                    className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5"
                  >
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10 sm:h-14 sm:w-14">
                      <span className="text-sm font-bold text-primary">
                        {session.date.getDate()}
                      </span>
                      <span className="text-[9px] text-gray-500">
                        {isSunday(session.date) ? 'SUN' : formatDay(session.date).slice(0, 3).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="font-bold text-gray-900">{label}</p>
                      <p className="text-xs text-gray-500 sm:text-sm">
                        {formatDay(session.date)}, {formatDate(session.date)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-bold text-success">
                        {present}/{session.attendance.length}
                      </p>
                      <p className="text-xs text-gray-500">{rate.toFixed(0)}%</p>
                      <div className="mt-1 flex items-center justify-end gap-1 text-xs text-gray-400">
                        <ClipboardList className="h-3 w-3" />
                        {session.activities.length}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
                  </Link>
                  <div className="border-t border-gray-100 px-4 pb-3 pt-2 sm:px-5">
                    <SessionTopicField year={year} month={month} session={session} variant="list" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </PageTransition>
  );
}
