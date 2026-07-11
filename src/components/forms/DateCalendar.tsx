import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { isSunday, sameDay } from '../../utils/sundayHelpers';
import { monthName } from '../../utils/formatters';

interface DateCalendarProps {
  selected: Date;
  onSelect: (date: Date) => void;
}

export function DateCalendar({ selected, onSelect }: DateCalendarProps) {
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth() + 1);

  const firstDay = new Date(viewYear, viewMonth - 1, 1);
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const startOffset = firstDay.getDay();

  const days: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(viewYear, viewMonth - 1, d));
  }

  function prevMonth() {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={prevMonth} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-sm font-semibold text-primary sm:text-base">
          {monthName(viewMonth)} {viewYear}
        </p>
        <button type="button" onClick={nextMonth} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-gray-400 sm:text-xs">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />;

          const isSun = isSunday(date);
          const isSelected = sameDay(date, selected);
          const isToday = sameDay(date, new Date());

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onSelect(date)}
              className={`relative flex h-8 items-center justify-center rounded-lg text-xs font-medium transition-all sm:h-9 sm:text-sm ${
                isSelected
                  ? 'bg-primary text-white shadow-md'
                  : isSun
                    ? 'bg-accent/15 text-accent hover:bg-accent/25'
                    : 'text-gray-700 hover:bg-gray-100'
              } ${isToday && !isSelected ? 'ring-2 ring-accent/40' : ''}`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-center text-xs text-gray-500">
        Selected: <span className="font-semibold text-primary">{format(selected, 'EEEE, dd MMM yyyy')}</span>
      </p>
      <p className="mt-1 text-center text-[10px] text-gray-400">
        Any date selectable • Sundays highlighted in blue • Today has ring
      </p>
    </div>
  );
}
