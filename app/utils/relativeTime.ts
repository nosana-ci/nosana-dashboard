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

// Compact relative time in the future, e.g. "in 47m", "in 2h", "in 3d".
export const formatTimeUntil = (date: string | Date | undefined): string => {
  if (!date) return "";
  const s = Math.floor((new Date(date).getTime() - Date.now()) / 1000);
  if (s <= 0) return "due";
  const m = Math.floor(s / 60);
  if (m < 60) return `in ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `in ${h}h`;
  const d = Math.floor(h / 24);
  return `in ${d}d`;
};
