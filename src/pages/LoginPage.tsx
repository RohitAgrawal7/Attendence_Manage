import { type FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, GraduationCap, Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('Enter username and password.');
      return;
    }
    setSubmitting(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 20% 10%, rgba(74,144,217,0.28), transparent 55%), radial-gradient(ellipse 70% 50% at 90% 90%, rgba(30,58,95,0.35), transparent 50%), linear-gradient(160deg, #0f2744 0%, #1e3a5f 45%, #16324f 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.35) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-[420px]"
      >
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 shadow-lg ring-1 ring-white/20 backdrop-blur"
          >
            <GraduationCap className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Bal Sangat Management Sewa
          </h1>
          <p className="mt-2 text-sm text-white/70">Sign in to continue to your workspace</p>
        </div>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="rounded-2xl border border-white/15 bg-white/95 p-6 shadow-2xl backdrop-blur-sm sm:p-8"
        >
          <h2 className="text-lg font-semibold text-primary">Welcome back</h2>
          <p className="mt-1 text-sm text-gray-500">Use your authorized account credentials</p>

          <label className="mt-6 block text-sm font-medium text-gray-700">
            Username
            <div className="relative mt-1.5">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                placeholder="Enter username"
              />
            </div>
          </label>

          <label className="mt-4 block text-sm font-medium text-gray-700">
            Password
            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-11 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          {error && (
            <p className="mt-4 rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-md transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-white/50">
          Authorized access only · Attendance & sewa records
        </p>
      </motion.div>
    </div>
  );
}
