import { useEffect, useRef, useState } from 'react';
import { BookOpen, Pencil } from 'lucide-react';
import { useData } from '../../context/DataContext';
import type { SundaySession } from '../../types';

interface SessionTopicFieldProps {
  year: number;
  month: number;
  session: SundaySession;
  variant?: 'list' | 'detail';
}

export function SessionTopicField({
  year,
  month,
  session,
  variant = 'list',
}: SessionTopicFieldProps) {
  const { updateSessionTopic } = useData();
  const [value, setValue] = useState(session.topic ?? '');
  const hydratingRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    hydratingRef.current = true;
    setValue(session.topic ?? '');
    const t = setTimeout(() => {
      hydratingRef.current = false;
    }, 50);
    return () => clearTimeout(t);
  }, [session.topic, session.date.getTime()]);

  useEffect(() => {
    if (hydratingRef.current) return;

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      updateSessionTopic({
        year,
        month,
        date: session.date,
        topic: value,
      });
    }, 400);

    return () => clearTimeout(timerRef.current);
  }, [value, year, month, session.date, updateSessionTopic]);

  const isList = variant === 'list';

  return (
    <div
      className={isList ? 'mt-1.5' : 'mt-2'}
      onClick={(e) => e.preventDefault()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <label
        className={`mb-1 flex items-center gap-1 ${
          isList ? 'text-[10px] text-gray-400' : 'text-xs text-white/70'
        }`}
      >
        <BookOpen className="h-3 w-3" />
        Topic
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          placeholder="Add session topic..."
          className={`w-full rounded-lg border px-2.5 py-1.5 pr-8 text-xs outline-none transition focus:ring-2 sm:text-sm ${
            isList
              ? 'border-gray-200 bg-gray-50 text-accent placeholder:text-gray-400 focus:border-accent focus:ring-accent/20'
              : 'border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20'
          }`}
        />
        <Pencil
          className={`pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${
            isList ? 'text-gray-400' : 'text-white/60'
          }`}
        />
      </div>
    </div>
  );
}
