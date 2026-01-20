const MS_PER_DAY = 1000 * 60 * 60 * 24;

export const parseDate = (dateStr?: string): Date => {
  if (!dateStr) return new Date();
  const date = new Date(dateStr);
  // Set to noon to avoid timezone/DST midnight shifts
  date.setHours(12, 0, 0, 0);
  return date;
};

export const formatDateForInput = (date?: Date): string => {
  if (!date) return '';
  return date.toISOString().split('T')[0];
};

export const formatDateDisplay = (dateStr?: string | Date): string => {
  if (!dateStr) return '';
  const date = typeof dateStr === 'string' ? parseDate(dateStr) : dateStr;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
};

export const addDays = (dateInput: string | Date, days: number): Date => {
  const date = typeof dateInput === 'string' ? parseDate(dateInput) : new Date(dateInput);
  date.setDate(date.getDate() + days);
  return date;
};

export const getDiffInDays = (start: string | Date, end: string | Date): number => {
  const s = typeof start === 'string' ? parseDate(start) : start;
  const e = typeof end === 'string' ? parseDate(end) : end;
  // Ensure we compare timestamps from noon-set dates
  s.setHours(12, 0, 0, 0);
  e.setHours(12, 0, 0, 0);
  return Math.ceil((e.getTime() - s.getTime()) / MS_PER_DAY);
};