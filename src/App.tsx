import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { DataProvider, useData } from './context/DataContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomePage } from './pages/HomePage';
import { YearPage } from './pages/YearPage';
import { MonthPage } from './pages/MonthPage';
import { SessionDetailPage } from './pages/SessionDetailPage';
import { StudentsPage } from './pages/StudentsPage';
import { BinPage } from './pages/BinPage';

function AppShell() {
  const { loading, error, refresh, years, staleWarning } = useData();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="text-sm font-medium text-primary">Loading student data…</p>
        <p className="max-w-sm text-center text-xs text-gray-400">
          Connecting to the API — first load can take a few seconds
        </p>
      </div>
    );
  }

  if (error && years.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 px-4 text-center">
        <p className="text-sm font-medium text-red-600">Could not connect to API</p>
        <p className="max-w-md text-sm text-gray-500">{error}</p>
        <p className="max-w-md text-xs text-gray-400">
          Confirm the backend is running and <code className="rounded bg-gray-100 px-1">VITE_API_URL</code>{' '}
          points to it in production.
        </p>
        <button
          type="button"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
          onClick={() => void refresh()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      {staleWarning && (
        <div className="bg-amber-50 px-4 py-2 text-center text-xs text-amber-800">
          Showing cached data — live refresh failed.{' '}
          <button type="button" className="font-semibold underline" onClick={() => void refresh()}>
            Retry now
          </button>
        </div>
      )}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/bin" element={<BinPage />} />
          <Route path="/year/:year" element={<YearPage />} />
          <Route path="/year/:year/month/:month" element={<MonthPage />} />
          <Route path="/year/:year/month/:month/date/:date" element={<SessionDetailPage />} />
          <Route path="/year/:year/month/:month/sunday/:week" element={<SessionDetailPage />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <DataProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </DataProvider>
    </ErrorBoundary>
  );
}
