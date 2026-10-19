export function formatISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseISODate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function getMonthMatrix(year: number, monthIndex: number): Date[][] {
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0);

  // 0 is Sunday, 1 is Monday... let's use Monday as first day of week (ISO standard for work weeks)
  let startingDay = firstDayOfMonth.getDay() - 1;
  if (startingDay === -1) startingDay = 6; // Sunday becomes 6

  const matrix: Date[][] = [];
  let currentWeek: Date[] = [];

  // Previous month trailing days
  for (let i = startingDay; i > 0; i--) {
    const prevDate = new Date(year, monthIndex, 1 - i);
    currentWeek.push(prevDate);
  }

  // Days of current month
  for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
    currentWeek.push(new Date(year, monthIndex, day));
    if (currentWeek.length === 7) {
      matrix.push(currentWeek);
      currentWeek = [];
    }
  }

  // Next month leading days to fill grid
  if (currentWeek.length > 0) {
    let nextDay = 1;
    while (currentWeek.length < 7) {
      currentWeek.push(new Date(year, monthIndex + 1, nextDay++));
    }
    matrix.push(currentWeek);
  }

  return matrix;
}

export function getISOWeekId(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function getWeekDateRange(weekId: string): { startDate: string; endDate: string } {
  // e.g. 2026-W42
  const parts = weekId.split('-W');
  if (parts.length !== 2) return { startDate: '', endDate: '' };
  const year = parseInt(parts[0]);
  const week = parseInt(parts[1]);

  // Find 4th of January of that year
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }

  const ISOweekEnd = new Date(ISOweekStart);
  ISOweekEnd.setDate(ISOweekStart.getDate() + 6);

  return {
    startDate: formatISODate(ISOweekStart),
    endDate: formatISODate(ISOweekEnd),
  };
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
