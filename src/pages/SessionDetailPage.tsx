import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Activity } from '../types';
import { useData } from '../context/DataContext';
import { pdfService } from '../services/pdfService';
import { Header } from '../components/layout/Header';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { PdfButton } from '../components/ui/PdfButton';
import { ShareSessionReportButton } from '../components/ui/ShareReportButton';
import { StudentReportPanel } from '../components/reports/StudentReportPanel';
import { AttendanceTile } from '../components/ui/AttendanceTile';
import { ActivityCard } from '../components/ui/ActivityCard';
import { ActivityForm } from '../components/forms/ActivityForm';
import { SessionTopicField } from '../components/ui/SessionTopicField';
import { PageTransition } from '../components/animations/PageTransition';
import { formatDate, formatDay, monthName } from '../utils/formatters';
import { getAbsentCount, getAttendanceRate, getPresentCount } from '../utils/stats';
import { parseDateKey, sessionLabel, toDateKey } from '../utils/sundayHelpers';
import { DataPdfPanel } from '../components/pdf/DataPdfPanel';
import { buildSessionPdfEntry } from '../utils/dataPdfHelpers';

type Tab = 'attendance' | 'activities';

export function SessionDetailPage() {
  const { year: yearParam, month: monthParam, date: dateParam, week: weekParam } = useParams<{
    year: string;
    month: string;
    date?: string;
    week?: string;
  }>();
  const navigate = useNavigate();
  const year = Number(yearParam);
  const month = Number(monthParam);
  const { getSessionByDate, getSunday, deleteAttendance, deleteActivity, deleteSession, setEditTarget } = useData();
  const [tab, setTab] = useState<Tab>('attendance');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [reportStudentId, setReportStudentId] = useState<string | undefined>();

  const sessionDate = dateParam ? parseDateKey(dateParam) : null;
  const session = sessionDate
    ? getSessionByDate(year, month, sessionDate)
    : weekParam
      ? getSunday(year, month, Number(weekParam))
      : undefined;

  const mName = monthName(month);
  const label = session ? sessionLabel(session.date) : '';

  useEffect(() => {
    if (session && !dateParam && weekParam) {
      navigate(`/year/${year}/month/${month}/date/${toDateKey(session.date)}`, { replace: true });
    }
  }, [session, dateParam, weekParam, year, month, navigate]);

  if (!session) {
    return (
      <PageTransition>
        <Header title="Not Found" />
        <div className="mx-auto max-w-6xl px-4 py-12 text-center text-gray-500">
          Session not found. <Link to="/" className="text-accent underline">Go home</Link>
        </div>
      </PageTransition>
    );
  }

  function handleDelete(studentId: string, studentName: string) {
    if (!confirm(`Delete ${studentName} from this session?`)) return;
    deleteAttendance({ studentId, year, month, date: session!.date });
    if (expandedId === studentId) setExpandedId(null);
  }

  function toggleExpand(studentId: string) {
    setExpandedId((prev) => (prev === studentId ? null : studentId));
  }

  function handleEditActivity(activity: Activity) {
    setEditingActivity(activity);
    setShowActivityForm(true);
  }

  function handleDeleteActivity(activityId: string, title: string) {
    if (!confirm(`Delete activity "${title}"?`)) return;
    deleteActivity({ activityId, year, month, date: session!.date });
    if (editingActivity?.id === activityId) {
      setEditingActivity(null);
      setShowActivityForm(false);
    }
  }

  async function handleDeleteSession() {
    if (
      !confirm(
        `Move this session (${label}) to Bin?\n\nAttendance and activities will be hidden for 30 days. Restore anytime from the Bin page.`,
      )
    ) {
      return;
    }
    try {
      await deleteSession({ year, month, date: session!.date });
      navigate(`/year/${year}/month/${month}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete session');
    }
  }

  function closeActivityForm() {
    setShowActivityForm(false);
    setEditingActivity(null);
  }

  function openAddActivity() {
    setEditingActivity(null);
    setShowActivityForm(true);
  }

  return (
    <PageTransition>
      <Header
        title={label}
        actions={
          <div className="flex items-center gap-2">
            <ShareSessionReportButton session={session} year={year} month={month} />
            <PdfButton onClick={() => pdfService.exportSunday(session, year, month)} />
            <button
              type="button"
              onClick={() => void handleDeleteSession()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-300/40 bg-red-500/20 px-3 py-2 text-xs font-semibold text-white hover:bg-red-500/30 sm:text-sm"
              title="Move session to Bin"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        }
      />
      <Breadcrumb
        items={[
          { label: `${year}`, to: `/year/${year}` },
          { label: mName, to: `/year/${year}/month/${month}` },
          { label },
        ]}
      />

      <div className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="gradient-primary rounded-xl p-4 sm:p-6"
        >
          <div className="flex items-center gap-2 text-white/90">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium sm:text-base">
              {formatDay(session.date)}, {formatDate(session.date)}
            </span>
          </div>
          <SessionTopicField year={year} month={month} session={session} variant="detail" />
          <div className="mt-4 flex justify-around gap-4">
            {[
              { label: 'Present', value: getPresentCount(session), color: '#69f0ae' },
              { label: 'Absent', value: getAbsentCount(session), color: '#ff8a80' },
              { label: 'Rate', value: `${getAttendanceRate(session).toFixed(0)}%`, color: '#ffd54f' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-xl font-bold sm:text-2xl" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-xs text-white/75">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <StudentReportPanel
          scope={{ type: 'session', year, month, date: session.date }}
          scopeLabel={`${label} — ${formatDate(session.date)}`}
          initialStudentId={reportStudentId}
          compact
        />

        <DataPdfPanel
          scopeKey={`session-${year}-${month}-${session.weekNumber}`}
          title="Data PDF Names"
          entries={[buildSessionPdfEntry(session, year, month)]}
          onExport={() => pdfService.exportSunday(session, year, month)}
        />

        <Link
          to="/"
          onClick={() => setEditTarget(null)}
          className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-accent/40 bg-accent/5 py-3 text-sm font-medium text-accent hover:bg-accent/10"
        >
          <Pencil className="h-4 w-4" />
          Add or edit attendance on home page
        </Link>

        <div className="flex rounded-xl bg-white p-1 card-shadow">
          {([
            { id: 'attendance' as Tab, label: `Attendance (${session.attendance.length})`, icon: Users },
            { id: 'activities' as Tab, label: `Activities (${session.activities.length})`, icon: ClipboardList },
          ]).map(({ id, label: tabLabel, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-medium transition-colors sm:gap-2 sm:py-3 sm:text-sm ${
                tab === id ? 'text-white' : 'text-gray-500 hover:text-primary'
              }`}
            >
              {tab === id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-lg gradient-primary"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tabLabel}</span>
                <span className="sm:hidden">{id === 'attendance' ? 'Attend.' : 'Activ.'}</span>
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'attendance' ? (
            <motion.div
              key="attendance"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
            >
              {session.attendance.length === 0 ? (
                <p className="py-8 text-center text-gray-500">No attendance yet. Add students from the home page form.</p>
              ) : (
                <div className="space-y-4">
                  {/* <StudentAttendanceTable
                    rows={sessionToTableRows(session)}
                    title="All Students — This Session"
                    subtitle={`${session.attendance.length} students • ${label}`}
                  /> */}

                  <div className="card-shadow overflow-hidden rounded-xl bg-white">
                  <div className="border-b border-gray-100 bg-gray-50 px-4 py-2.5">
                    <p className="text-xs font-medium text-gray-500">
                      {session.attendance.length} students — one line view, tap to edit
                    </p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {session.attendance.map((record) => (
                      <AttendanceTile
                        key={record.student.id}
                        record={record}
                        year={year}
                        month={month}
                        date={session.date}
                        isOpen={expandedId === record.student.id}
                        onToggle={() => toggleExpand(record.student.id)}
                        onDelete={() => handleDelete(record.student.id, record.student.name)}
                        onViewReport={() => setReportStudentId(record.student.id)}
                      />
                    ))}
                  </div>
                </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="activities"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-600">
                  {session.activities.length} activities for this session
                </p>
                {!showActivityForm && (
                  <button
                    type="button"
                    onClick={openAddActivity}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-light sm:text-sm"
                  >
                    <Plus className="h-4 w-4" /> Add Activity
                  </button>
                )}
              </div>

              {showActivityForm && (
                <ActivityForm
                  year={year}
                  month={month}
                  date={session.date}
                  editing={editingActivity}
                  onDone={closeActivityForm}
                />
              )}

              {session.activities.length === 0 && !showActivityForm ? (
                <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center">
                  <p className="text-gray-500">No activities yet</p>
                  <button
                    type="button"
                    onClick={openAddActivity}
                    className="mt-3 text-sm font-medium text-accent hover:underline"
                  >
                    + Add first activity
                  </button>
                </div>
              ) : (
                session.activities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    onEdit={() => handleEditActivity(activity)}
                    onDelete={() => handleDeleteActivity(activity.id, activity.title)}
                  />
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
