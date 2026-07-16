import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, CalendarCheck, Calendar, TrendingUp, ChevronRight, CalendarDays, List } from 'lucide-react';
import { useData } from '../context/DataContext';
import { pdfService } from '../services/pdfService';
import { Header } from '../components/layout/Header';
import { StatCard } from '../components/ui/StatCard';
import { PdfButton } from '../components/ui/PdfButton';
import { AttendanceForm } from '../components/forms/AttendanceForm';
import { StudentReportPanel } from '../components/reports/StudentReportPanel';
import { PageTransition, staggerContainer, staggerItem } from '../components/animations/PageTransition';
import { getYearAverageAttendance, getYearTotalSessions } from '../utils/stats';
import { usePdfPreview } from '../hooks/usePdfPreview';

export function HomePage() {
  const { years, students } = useData();
  const { openPreview, previewModal } = usePdfPreview();
  const totalSessions = years.reduce((sum, y) => sum + getYearTotalSessions(y), 0);
  const latestYear = years[0];

  return (
    <PageTransition>
      <Header
        title="Dashboard"
        actions={
          latestYear ? (
            <PdfButton
              onDownload={() => pdfService.exportYear(latestYear, students)}
              onPreview={() =>
                openPreview(
                  `Year ${latestYear.year} Attendance Report`,
                  () => pdfService.getYearBlobUrl(latestYear, students),
                  () => pdfService.exportYear(latestYear, students),
                )
              }
              label="Download PDF"
              previewLabel="Preview PDF"
            />
          ) : undefined
        }
      />

      {/* Hero */}
      <section className="gradient-primary px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl text-left">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-white sm:text-3xl"
          >
            Attendance & Activities
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-1 text-sm text-white/80 sm:text-base"
          >
            Year → Month → Sunday Sessions
          </motion.p>
        </div>
      </section>

      {/* Attendance Form */}
      <div id="attendance-form" className="py-6 sm:py-8">
        <AttendanceForm />
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-6 sm:px-6 sm:pb-8">
        <div className="mb-6">
          <StudentReportPanel scope={{ type: 'all' }} scopeLabel="All Time" />
        </div>
        {/* Quick link to all students */}
        <motion.div variants={staggerItem} className="mb-6">
          <Link
            to="/students"
            className="card-shadow card-hover flex items-center gap-4 rounded-xl bg-white p-4 sm:p-5"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
              <List className="h-6 w-6 text-accent" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="font-bold text-primary">All Saints Master List</p>
              <p className="text-xs text-gray-500 sm:text-sm">
                View every student • full details • attendance stats • no duplicates
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
        >
          <motion.div variants={staggerItem}>
            <StatCard title="Students" value={`${students.length}`} icon={Users} color="#4a90d9" />
          </motion.div>
          <motion.div variants={staggerItem}>
            <StatCard title="Sessions" value={`${totalSessions}`} icon={CalendarCheck} color="#2e7d32" />
          </motion.div>
          <motion.div variants={staggerItem}>
            <StatCard title="Years" value={`${years.length}`} icon={Calendar} color="#f57c00" />
          </motion.div>
          <motion.div variants={staggerItem}>
            <StatCard
              title="Avg Attendance"
              value={latestYear ? `${getYearAverageAttendance(latestYear).toFixed(0)}%` : '0%'}
              icon={TrendingUp}
              color="#1e3a5f"
            />
          </motion.div>
        </motion.div>

        {/* Year list */}
        <h3 className="mb-4 mt-8 text-lg font-bold text-primary sm:text-xl">Browse by Year</h3>
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-3"
        >
          {years.map((year) => (
            <motion.div key={year.year} variants={staggerItem}>
              <Link
                to={`/year/${year.year}`}
                className="card-shadow card-hover flex items-center gap-4 rounded-xl bg-white p-4 sm:p-5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <CalendarDays className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-lg font-bold text-primary sm:text-xl">{year.year}</p>
                  <p className="text-xs text-gray-500 sm:text-sm">
                    {year.months.length} months • {getYearTotalSessions(year)} sessions •{' '}
                    {getYearAverageAttendance(year).toFixed(0)}% avg
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
      {previewModal}
    </PageTransition>
  );
}
