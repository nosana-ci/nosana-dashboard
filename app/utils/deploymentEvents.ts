import type { DeploymentEventItem } from "@nosana/api";

// snake_case / UPPER_CASE event or task name → "Title case" label.
export const humanizeEventType = (type?: string): string => {
  const t = (type || "").replace(/_/g, " ").trim().toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

// Scheduled task type → tone class: list is created work (green), extend is
// upkeep (orange), stop tears down (red).
export const taskKind = (task?: string): string => {
  const t = (task || "").toUpperCase();
  if (t.includes("STOP")) return "is-danger-kind";
  if (t.includes("LIST")) return "is-success-kind";
  return "is-warning-kind";
};

// Event → tone class for its timeline dot. Actions match the scheduled-task
// scheme: list = green, extend = orange, stop = red; failures are red too.
export const eventKind = (event: DeploymentEventItem): string => {
  const t = `${event.type || ""} ${event.category || ""}`.toUpperCase();
  if (/ERROR|INSUFFICIENT|FAIL|STOP/.test(t)) return "is-danger-kind";
  if (/EXTEND/.test(t)) return "is-warning-kind";
  if (/LIST|COMPLETED|SUCCESS/.test(t)) return "is-success-kind";
  if (/START|RUNNING|JOB/.test(t)) return "is-info-kind";
  return "is-neutral-kind";
};
