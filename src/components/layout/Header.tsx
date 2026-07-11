import { Link } from 'react-router-dom';
import { GraduationCap, Users, Trash2 } from 'lucide-react';

interface HeaderProps {
  title: string;
  actions?: React.ReactNode;
}

export function Header({ title, actions }: HeaderProps) {
  return (
    <header className="gradient-primary sticky top-0 z-50 shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-white transition-opacity hover:opacity-90">
            <GraduationCap className="h-6 w-6 sm:h-7 sm:w-7" />
            <span className="hidden text-sm font-medium opacity-80 sm:inline">Bal Sangat Management Sewa</span>
          </Link>
          <Link
            to="/students"
            className="hidden items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/20 sm:flex"
          >
            <Users className="h-3.5 w-3.5" /> All Saints
          </Link>
          <Link
            to="/bin"
            className="hidden items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/20 sm:flex"
          >
            <Trash2 className="h-3.5 w-3.5" /> Bin
          </Link>
          <span className="text-white/40">|</span>
          <h1 className="text-base font-semibold text-white sm:text-lg">{title}</h1>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
