import { Link, useLocation } from 'react-router-dom';
import { GraduationCap, Users, Trash2, LogOut, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  title: string;
  actions?: React.ReactNode;
}

function NavLink({
  to,
  icon: Icon,
  label,
  active,
}: {
  to: string;
  icon: typeof Users;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        active
          ? 'bg-white text-primary shadow-sm'
          : 'text-white/85 hover:bg-white/10 hover:text-white'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}

export function Header({ title, actions }: HeaderProps) {
  const { username, logout } = useAuth();
  const location = useLocation();
  const onStudents = location.pathname.startsWith('/students');
  const onBin = location.pathname.startsWith('/bin');
  const onHome = location.pathname === '/';
  const initial = (username?.[0] ?? 'U').toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#16324f] shadow-lg">
      <div className="gradient-primary">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
          <div className="flex min-w-0 items-center gap-6">
            <Link
              to="/"
              className="group flex min-w-0 items-center gap-2.5 text-white"
              aria-label="Bal Sangat Management Sewa — Home"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20 transition group-hover:bg-white/25">
                <GraduationCap className="h-5 w-5" />
              </span>
              <span className="hidden min-w-0 flex-col leading-tight sm:flex">
                <span className="truncate text-sm font-semibold tracking-tight">Bal Sangat</span>
                <span className="truncate text-[11px] font-medium text-white/65">Management Sewa</span>
              </span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
              <NavLink to="/" icon={Home} label="Home" active={onHome} />
              <NavLink to="/students" icon={Users} label="All Saints" active={onStudents} />
              <NavLink to="/bin" icon={Trash2} label="Bin" active={onBin} />
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <nav className="flex items-center gap-1 md:hidden" aria-label="Main mobile">
              <Link
                to="/"
                className={`rounded-lg p-2 ${onHome ? 'bg-white text-primary' : 'text-white/90 hover:bg-white/10'}`}
                title="Home"
              >
                <Home className="h-4 w-4" />
              </Link>
              <Link
                to="/students"
                className={`rounded-lg p-2 ${onStudents ? 'bg-white text-primary' : 'text-white/90 hover:bg-white/10'}`}
                title="All Saints"
              >
                <Users className="h-4 w-4" />
              </Link>
              <Link
                to="/bin"
                className={`rounded-lg p-2 ${onBin ? 'bg-white text-primary' : 'text-white/90 hover:bg-white/10'}`}
                title="Bin"
              >
                <Trash2 className="h-4 w-4" />
              </Link>
            </nav>

            <div className="hidden h-6 w-px bg-white/20 sm:block" />

            <div className="flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-2 ring-1 ring-white/15 sm:pr-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                {initial}
              </span>
              {username && (
                <span className="hidden max-w-[9rem] truncate text-xs font-medium text-white/90 sm:inline">
                  {username}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-white/85 transition hover:bg-white/10 hover:text-white sm:px-3"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-black/10 bg-[#1a3a5c]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <h1 className="min-w-0 truncate text-sm font-semibold tracking-tight text-white sm:text-base">
            {title}
          </h1>
          {actions ? (
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">{actions}</div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
