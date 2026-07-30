import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarRange } from 'lucide-react';
import { useData } from '../context/DataContext';
import { pdfService } from '../services/pdfService';
import { Header } from '../components/layout/Header';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { PdfButton } from '../components/ui/PdfButton';
import { ShareYearReportButton } from '../components/ui/ShareReportButton';
import { StudentReportPanel } from '../components/reports/StudentReportPanel';
import { SummaryBar } from '../components/ui/SummaryBar';
import { PageTransition, staggerContainer, staggerItem } from '../components/animations/PageTransition';
import { monthName } from '../utils/formatters';
import {
  getMonthAverageAttendance,
  getYearAverageAttendance,
  getYearTotalSessions,
} from '../utils/stats';
import { DataPdfPanel } from '../components/pdf/DataPdfPanel';
import { buildYearPdfEntries } from '../utils/dataPdfHelpers';
import { StudentDataTablesPanel } from '../components/students/StudentDataTablesPanel';
import { usePdfPreview } from '../hooks/usePdfPreview';
import type { DataPdfEntry } from '../types';

export function YearPage() {
  const { year: yearParam } = useParams<{ year: string }>();
  const year = Number(yearParam);
  const { getYear, students } = useData();
  const { openPreview, previewModal } = usePdfPreview();
  const yearData = getYear(year);

  if (!yearData) {
    return (
      <PageTransition>
        <Header title="Not Found" />
        <div className="mx-auto max-w-6xl px-4 py-12 text-center text-gray-500">
          Year not found. <Link to="/" className="text-accent underline">Go home</Link>
        </div>
      </PageTransition>
    );
  }

  function resolvePdfEntry(entry: DataPdfEntry) {
    if (entry.id.startsWith('month-')) {
      const parts = entry.id.split('-');
      const m = Number(parts[2]);
      const monthData = yearData!.months.find((x) => x.month === m);
      if (monthData) {
        return {
          title: entry.name,
          download: () => pdfService.exportMonth(monthData),
          getUrl: () => pdfService.getMonthBlobUrl(monthData),
        };
      }
    }
    return {
      title: `Year ${yearData!.year} Attendance Report`,
      download: () => pdfService.exportYear(yearData!, students),
      getUrl: () => pdfService.getYearBlobUrl(yearData!, students),
    };
  }

  return (
    <PageTransition>
      <Header
        title={`Year ${yearData.year}`}
        actions={
          <div className="flex items-center gap-2">
            <ShareYearReportButton yearData={yearData} />
            <PdfButton
              onDownload={() => pdfService.exportYear(yearData, students)}
              onPreview={() =>
                openPreview(
                  `Year ${yearData.year} Attendance Report`,
                  () => pdfService.getYearBlobUrl(yearData, students),
                  () => pdfService.exportYear(yearData, students),
                )
              }
            />
          </div>
        }
      />
      <Breadcrumb items={[{ label: `${yearData.year}` }]} />

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <SummaryBar
          items={[
            { label: 'Months', value: `${yearData.months.length}` },
            { label: 'Sessions', value: `${getYearTotalSessions(yearData)}` },
            { label: 'Avg %', value: `${getYearAverageAttendance(yearData).toFixed(0)}%` },
          ]}
        />

        <StudentReportPanel
          scope={{ type: 'year', year: yearData.year }}
          scopeLabel={`Year ${yearData.year}`}
          compact
        />

        <DataPdfPanel
          scopeKey={`year-${yearData.year}`}
          title="Data PDF Names"
          entries={buildYearPdfEntries(yearData)}
          onExport={(entry) => resolvePdfEntry(entry).download()}
          onPreview={(entry) => {
            const pdf = resolvePdfEntry(entry);
            openPreview(pdf.title, pdf.getUrl, pdf.download);
          }}
        />

        <StudentDataTablesPanel
          sessions={yearData.months.flatMap((m) => m.sundays)}
          title={`All Student Data — Every Month & Week (${yearData.year})`}
          groupByMonth
        />

        <h3 className="text-lg font-bold text-primary">Select Month</h3>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
        >
          {yearData.months.map((month) => {
            const avg = getMonthAverageAttendance(month);
            return (
              <motion.div key={month.month} variants={staggerItem}>
                <Link
                  to={`/year/${yearData.year}/month/${month.month}`}
                  className="card-shadow card-hover flex h-full flex-col rounded-xl bg-white p-4 sm:p-5"
                >
                  <CalendarRange className="h-7 w-7 text-accent" />
                  <p className="mt-3 font-bold text-primary">{monthName(month.month)}</p>
                  <p className="text-xs text-gray-500">{month.sundays.length} Sundays</p>
                  <div className="mt-auto pt-4">
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${avg}%` }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="h-full rounded-full bg-success"
                      />
                    </div>
                    <p className="mt-1 text-xs font-medium text-success">{avg.toFixed(0)}% attendance</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
      {previewModal}
    </PageTransition>
  );
}
