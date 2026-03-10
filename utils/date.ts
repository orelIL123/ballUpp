import { Timestamp } from 'firebase/firestore';

export function parseDateTimeInput(date: string, time: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);

  const parsed = new Date(year, (month ?? 1) - 1, day ?? 1, hours ?? 0, minutes ?? 0);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error('יש להזין תאריך ושעה תקינים.');
  }

  return parsed;
}

export function formatTimestamp(value: Timestamp | Date | null | undefined): string {
  if (!value) {
    return 'לא נקבע';
  }

  const date = value instanceof Date ? value : value.toDate();

  return new Intl.DateTimeFormat('he-IL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function isSameDay(value: Timestamp, target: Date): boolean {
  const date = value.toDate();

  return (
    date.getFullYear() === target.getFullYear() &&
    date.getMonth() === target.getMonth() &&
    date.getDate() === target.getDate()
  );
}
