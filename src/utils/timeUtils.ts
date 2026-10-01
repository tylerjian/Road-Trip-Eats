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
  return t >= s && t <= e;
}
