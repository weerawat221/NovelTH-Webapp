/**
 * Utility functions for scheduled chapter publishing and timezone handling.
 */

/**
 * Normalizes a timestamp string from Supabase (which might lack 'Z' or timezone offset)
 * to ensure JavaScript Date parses it as UTC.
 */
export function normalizeUtcTimestamp(dateStr: string): string {
  if (!dateStr) return dateStr;
  if (dateStr.endsWith("Z") || dateStr.includes("+")) return dateStr;
  return dateStr.replace(" ", "T") + "Z";
}

/**
 * Checks if a chapter should be visible/readable as published.
 * Returns true if status is 'published', or if status is 'scheduled' and scheduled_at has arrived.
 */
export function isChapterPublished(chapter: {
  status: string;
  scheduled_at?: string | null;
}): boolean {
  if (chapter.status === "published") return true;
  if (chapter.status === "scheduled" && chapter.scheduled_at) {
    const scheduledTime = new Date(normalizeUtcTimestamp(chapter.scheduled_at)).getTime();
    return scheduledTime <= Date.now();
  }
  return false;
}

/**
 * Synchronizes scheduled chapters with the database by calling the PostgreSQL function
 * public.publish_scheduled_chapters().
 */
export async function syncScheduledChapters(supabase: any): Promise<number> {
  try {
    const { data, error } = await supabase.rpc("publish_scheduled_chapters");
    if (error) {
      console.warn("syncScheduledChapters warning:", error.message);
      return 0;
    }
    return Number(data) || 0;
  } catch (err) {
    console.warn("syncScheduledChapters failed silently:", err);
    return 0;
  }
}

/**
 * Converts a Date or UTC date string into "YYYY-MM-DDTHH:mm" in the user's local timezone
 * for use in HTML <input type="datetime-local">.
 */
export function toLocalDatetimeInput(date: Date | string): string {
  const d = typeof date === "string" ? new Date(normalizeUtcTimestamp(date)) : date;
  if (isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Converts a "YYYY-MM-DDTHH:mm" local datetime string from <input type="datetime-local">
 * into a UTC ISO string for storage in PostgreSQL.
 */
export function parseLocalDatetimeToUTC(localString: string): string {
  if (!localString) return "";
  const [datePart, timePart] = localString.split("T");
  if (!datePart || !timePart) {
    return new Date(localString).toISOString();
  }
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  const localDate = new Date(year, month - 1, day, hours, minutes, 0);
  return localDate.toISOString();
}
