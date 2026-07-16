/**
 * Convert a date string to a Thai relative time string.
 * e.g. "3 นาทีที่แล้ว", "2 ชั่วโมงที่แล้ว", "1 ปีที่แล้ว"
 */
export function relativeTime(dateStr: string): string {
  const now = new Date();
  // Supabase returns timestamps without timezone suffix (e.g. "2026-07-15 03:45:00").
  // Append 'Z' to treat it as UTC so the diff is computed correctly regardless of local timezone.
  const normalized = dateStr.endsWith("Z") || dateStr.includes("+") ? dateStr : dateStr.replace(" ", "T") + "Z";
  const date = new Date(normalized);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "เมื่อสักครู่";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} ชั่วโมงที่แล้ว`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} วันที่แล้ว`;

  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth} เดือนที่แล้ว`;

  const diffYear = Math.floor(diffMonth / 12);
  return `${diffYear} ปีที่แล้ว`;
}
