import type { DeploymentEventItem } from "@nosana/api";
import type { StatusTone } from "~/composables/useStatus";

// snake_case / UPPER_CASE event or task name → "Title case" label.
export const humanizeEventType = (type?: string): string => {
  const t = (type || "").replace(/_/g, " ").trim().toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

// Both of these use the same tones as every status elsewhere: green is
// live or finished, orange is waiting or scheduled, red is a failure, grey is
// deliberately not running.
//
// Red is failures only. A stop is something the user or a schedule asked for,
// so it is grey like every other stopped state — it used to be red here and
// nowhere else, which made routine teardown read as an incident.

// Scheduled task type → tone class. Everything here is due in the future, so
// orange ("waiting") is the rule and a scheduled teardown is the one exception:
// grey, like every other stopped state. A scheduled task is never green — green
// would put "will post jobs in 5h" in the same colour as "posted successfully",
// which is the distinction this panel most needs to make.
export const taskKind = (task?: string): string => {
  const t = (task || "").toUpperCase();
  if (t.includes("STOP")) return "is-neutral-kind";
  return "is-warning-kind";
};

// Event → tone for its timeline mark. Tested most specific first: the string is
// type + category concatenated, so an event naming both a job and a failure has
// to match the failure.
//
// An event is a record of something that already happened, never something
// happening now, so this never returns `live` — a timeline mark is a settled
// fact and gets a glyph, and nothing on a timeline pulses. Which is also why
// CONFIRMED has to be tested before LIST: "JOB_LIST_CONFIRMED" is a job that
// reached the market, so it earns the checkmark rather than a dot.
export const eventTone = (event: DeploymentEventItem): StatusTone => {
  const t = `${event.type || ""} ${event.category || ""}`.toUpperCase();
  if (/ERROR|INSUFFICIENT|FAIL|REJECT/.test(t)) return "danger";
  if (/STOP|DELIST/.test(t)) return "neutral";
  if (
    /CONFIRMED|COMPLETED|SUCCESS|FINISH|LIST|START|RUNNING|ASSIGN|CLAIM/.test(t)
  )
    return "ok";
  if (/EXTEND|QUEUE|PENDING|SCHEDULE/.test(t)) return "warn";
  return "neutral";
};
