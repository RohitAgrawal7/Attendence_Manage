import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomePage } from './pages/HomePage';
import { YearPage } from './pages/YearPage';
import { MonthPage } from './pages/MonthPage';
import { SessionDetailPage } from './pages/SessionDetailPage';
import { StudentsPage } from './pages/StudentsPage';
import { BinPage } from './pages/BinPage';
import { LoginPage } from './pages/LoginPage';

function AppShell() {
  const { loading, error, refresh, years, staleWarning } = useData();

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
      {/* Stable routes — no remount/fade-to-white on every nav click */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/bin" element={<BinPage />} />
        <Route path="/year/:year" element={<YearPage />} />
        <Route path="/year/:year/month/:month" element={<MonthPage />} />
        <Route path="/year/:year/month/:month/date/:date" element={<SessionDetailPage />} />
        <Route path="/year/:year/month/:month/sunday/:week" element={<SessionDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function AuthGate() {
  const { token, ready } = useAuth();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1e3a5f]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </div>
    );
  }

  if (!token) {
    return <LoginPage />;
  }

  return (
    <DataProvider>
      <AppShell />
    </DataProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AuthGate />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
