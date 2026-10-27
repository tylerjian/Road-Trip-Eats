import { OpeningPeriod } from '../types';

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatDistance(meters: number): string {
  const miles = meters / 1609.34;
  if (miles < 0.1) return `${Math.round(meters)} m`;
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

export function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000);
}

export function isWithinTimeSlot(time: Date, start: Date | null, end: Date | null): boolean {
  if (!start && !end) return true;
  const t = time.getHours() * 60 + time.getMinutes();
  const s = start ? start.getHours() * 60 + start.getMinutes() : 0;
  const e = end ? end.getHours() * 60 + end.getMinutes() : 23 * 60 + 59;
  // A slot like 21:00–02:00 wraps past midnight
  return s <= e ? t >= s && t <= e : t >= s || t <= e;
}

const MINUTES_PER_WEEK = 7 * 24 * 60;

function toWeekMinute(p: { day: number; hour: number; minute: number }): number {
  return p.day * 24 * 60 + p.hour * 60 + p.minute;
}

// Whether a place is open at `time`, given its weekly hours in its own local time.
// Returns null when the hours are unknown.
export function isOpenAt(
  periods: OpeningPeriod[] | undefined,
  utcOffsetMinutes: number | undefined,
  time: Date,
): boolean | null {
  if (!periods || periods.length === 0 || utcOffsetMinutes === undefined) return null;

  // Shift into the place's time zone, then read the fields back as UTC
  const local = new Date(time.getTime() + utcOffsetMinutes * 60000);
  const t = local.getUTCDay() * 24 * 60 + local.getUTCHours() * 60 + local.getUTCMinutes();

  return periods.some(({ open, close }) => {
    if (!close) return true;
    const start = toWeekMinute(open);
    let end = toWeekMinute(close);
    if (end <= start) end += MINUTES_PER_WEEK; // e.g. opens Saturday, closes Sunday
    return (t >= start && t < end) || (t + MINUTES_PER_WEEK >= start && t + MINUTES_PER_WEEK < end);
  });
}
