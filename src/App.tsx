import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { DataProvider, useData } from './context/DataContext';
import { HomePage } from './pages/HomePage';
import { YearPage } from './pages/YearPage';
import { MonthPage } from './pages/MonthPage';
import { SessionDetailPage } from './pages/SessionDetailPage';
import { StudentsPage } from './pages/StudentsPage';
import { BinPage } from './pages/BinPage';

function AppShell() {
  const { loading, error } = useData();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Loading student data…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 px-4 text-center">
        <p className="text-sm font-medium text-red-600">Could not connect to API</p>
        <p className="max-w-md text-sm text-gray-500">{error}</p>
        <p className="text-xs text-gray-400">Start the backend: cd Backend && npm run start:dev</p>
      </div>
    );
  }

  return (
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
  );
}

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </DataProvider>
  );
}
