/**
 * Client-side view tracking utilities with 24-hour cookie deduplication
 */

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value}; max-age=${maxAgeSeconds}; path=/; SameSite=Lax`;
}

/**
 * Tracks a chapter view by verifying cookie status and triggering a background API call
 * to avoid duplicate increments within a 24-hour window.
 */
export function trackChapterView(chapterId: number, novelId: number) {
  if (typeof window === "undefined") return;

  const cookieName = `viewed_chapter_${chapterId}`;

  // 1. Check if the chapter has already been viewed in the last 24 hours
  if (getCookie(cookieName)) {
    return;
  }

  // 2. Set the 24-hour cookie (86400 seconds)
  setCookie(cookieName, "true", 86400);

  // 3. Fire-and-forget API call to record the view on the server
  fetch(`/api/chapters/${chapterId}/view`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ novelId }),
  })
    .then((res) => {
      if (!res.ok && res.status !== 429) {
        console.warn(`[View Tracking] Failed to log view for chapter ${chapterId}. Status: ${res.status}`);
      }
    })
    .catch((err) => {
      // Log error silently to prevent interfering with Reader experience
      console.error("[View Tracking] Network error logging view:", err);
    });
}
