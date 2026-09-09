import type { DeploymentEventItem } from "@nosana/api";

// snake_case / UPPER_CASE event or task name → "Title case" label.
export const humanizeEventType = (type?: string): string => {
  const t = (type || "").replace(/_/g, " ").trim().toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

// Both of these use the same five tones as every status elsewhere: green is
// live/available, blue is finished, orange is waiting or scheduled, red is a
// failure, grey is deliberately not running.
//
// Red is failures only. A stop is something the user or a schedule asked for,
// so it is grey like every other stopped state — it used to be red here and
// nowhere else, which made routine teardown read as an incident.

// Scheduled task type → tone class.
export const taskKind = (task?: string): string => {
  const t = (task || "").toUpperCase();
  if (t.includes("STOP")) return "is-neutral-kind";
  if (t.includes("LIST")) return "is-success-kind";
  return "is-warning-kind";
};

// Event → tone class for its timeline dot. Tested most specific first: the
// string is type + category concatenated, so an event naming both a job and a
// failure has to match the failure.
export const eventKind = (event: DeploymentEventItem): string => {
  const t = `${event.type || ""} ${event.category || ""}`.toUpperCase();
  if (/ERROR|INSUFFICIENT|FAIL/.test(t)) return "is-danger-kind";
  if (/STOP/.test(t)) return "is-neutral-kind";
  if (/COMPLETED|SUCCESS/.test(t)) return "is-info-kind";
  if (/START|RUNNING|LIST/.test(t)) return "is-success-kind";
  if (/EXTEND|QUEUE|PENDING/.test(t)) return "is-warning-kind";
  return "is-neutral-kind";
};
