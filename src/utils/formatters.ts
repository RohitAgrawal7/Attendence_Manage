import { format } from 'date-fns';

export function monthName(month: number): string {
  return format(new Date(2024, month - 1, 1), 'MMMM');
}

export function formatDate(date: Date): string {
  return format(date, 'dd MMM yyyy');
}

export function formatDay(date: Date): string {
  return format(date, 'EEEE');
}

export function formatPercent(value: number): string {
  return `${value.toFixed(0)}%`;
}
