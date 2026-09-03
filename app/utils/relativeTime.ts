// Compact relative time in the past, e.g. "just now", "2m ago", "3h ago", "5d ago".
export const formatTimeAgo = (date: string | Date | undefined): string => {
  if (!date) return "";
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 45) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

// Compact relative time in the future, keeping the finer unit so we don't round
// a value like 3h50m down to a misleading "in 3h": "in 47m", "in 3h 50m",
// "in 2d 4h" (the trailing unit is dropped when it's zero, e.g. "in 3h").
export const formatTimeUntil = (date: string | Date | undefined): string => {
  if (!date) return "";
  const s = Math.floor((new Date(date).getTime() - Date.now()) / 1000);
  if (s <= 0) return "due";
  const totalMin = Math.floor(s / 60);
  if (totalMin < 60) return `in ${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  if (h < 24) {
    const m = totalMin % 60;
    return m ? `in ${h}h ${m}m` : `in ${h}h`;
  }
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return rh ? `in ${d}d ${rh}h` : `in ${d}d`;
};
