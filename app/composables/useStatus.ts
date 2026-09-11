/**
 * Global status management composable
 * Ensures consistent status colors and icons across all components
 */

// Status string constants
export const StatusStrings = {
  QUEUED: 'QUEUED',
  RUNNING: 'RUNNING', 
  COMPLETED: 'COMPLETED',
  SUCCESS: 'SUCCESS',
  STOPPED: 'STOPPED',
  FAILED: 'FAILED',
  YAML_ERROR: 'YAML_ERROR',
  PENDING: 'PENDING',
  // Deployment specific
  DRAFT: 'DRAFT',
  ERROR: 'ERROR',
  STARTING: 'STARTING',
  STOPPING: 'STOPPING',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  ARCHIVED: 'ARCHIVED',
  // Endpoint specific
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
  UNKNOWN: 'UNKNOWN',
  LOADING: 'LOADING'
} as const

// Numeric states (0-3)
export const States = {
  QUEUED: 0,
  RUNNING: 1,
  COMPLETED: 2,
  STOPPED: 3
} as const

/**
 * The five tones every status surface draws from — pills, dots, tags, timeline
 * nodes and endpoint rows.
 *
 * Colour says whether the state is good or bad; shape says whether it is still
 * happening. `live` and `ok` are both green because both are good news, and
 * `StatusMark` separates them by drawing a dot for one and a checkmark for the
 * other: a dot is ongoing, a glyph has settled. That pairing is also what keeps
 * the system readable without colour, since `ok` and `danger` differ by shape
 * as well as hue.
 */
export type StatusTone = 'live' | 'warn' | 'ok' | 'danger' | 'neutral'

const TONES: Record<string, StatusTone> = {
  // Up and serving right now.
  RUNNING: 'live',
  ACTIVE: 'live',
  ONLINE: 'live',

  // On its way up, or waiting for something. Reads the same to someone
  // watching, whichever stage of the climb it is in — including the statuses
  // the node reports for an operation (waiting/pending/init).
  QUEUED: 'warn',
  DRAFT: 'warn',
  STARTING: 'warn',
  PENDING: 'warn',
  WAITING: 'warn',
  INIT: 'warn',
  RESTARTING: 'warn',
  LOADING: 'warn',

  // Finished cleanly.
  COMPLETED: 'ok',
  SUCCESS: 'ok',
  FINISHED: 'ok',

  FAILED: 'danger',
  ERROR: 'danger',
  YAML_ERROR: 'danger',
  INSUFFICIENT_FUNDS: 'danger',

  // Deliberately not running.
  STOPPED: 'neutral',
  STOPPING: 'neutral',
  ARCHIVED: 'neutral',
  INACTIVE: 'neutral',
  OFFLINE: 'neutral'
}

/**
 * Get the tone for any status (string or number). Anything unrecognised is
 * neutral: a status we cannot read is not evidence that something is wrong,
 * and not evidence that it is starting either.
 */
export function getStatusTone(status: string | number): StatusTone {
  return TONES[normalizeStatus(status)] ?? 'neutral'
}

// Tone → Bulma modifier, for the tag-shaped status surfaces. Green covers both
// live and finished; the tag's icon is what separates them.
const TONE_CLASSES: Record<StatusTone, string> = {
  live: 'is-success',
  ok: 'is-success',
  warn: 'is-warning',
  danger: 'is-danger',
  neutral: 'is-dark'
}

/**
 * Get consistent status CSS class for any status (string or number)
 */
export function getStatusClass(status: string | number): string {
  return TONE_CLASSES[getStatusTone(status)]
}

/**
 * Get human-readable status text
 */
export function getStatusText(status: string | number): string {
  // Handle numeric states
  if (typeof status === 'number') {
    switch (status) {
      case 0: return 'Queued'
      case 1: return 'Running'
      case 2: return 'Completed'
      case 3: return 'Stopped'
      default: return 'Unknown'
    }
  }

  // Handle string statuses - return as-is with proper casing
  const statusStr = status?.toString() || 'Unknown'
  return statusStr.charAt(0).toUpperCase() + statusStr.slice(1).toLowerCase()
}

/**
 * Normalize any status to standard string format
 */
export function normalizeStatus(status: string | number): string {
  if (typeof status === 'number') {
    switch (status) {
      case 0: return StatusStrings.QUEUED
      case 1: return StatusStrings.RUNNING  
      case 2: return StatusStrings.COMPLETED
      case 3: return StatusStrings.STOPPED
      default: return 'UNKNOWN'
    }
  }
  
  return status?.toString().toUpperCase() || 'UNKNOWN'
}

/**
 * Check if a status represents an active/running state
 */
export function isActiveStatus(status: string | number): boolean {
  const normalized = normalizeStatus(status)
  return [
    StatusStrings.RUNNING,
    StatusStrings.PENDING,
    StatusStrings.STARTING
  ].includes(normalized as any)
}

/**
 * Check if a status represents a completed state
 */
export function isCompletedStatus(status: string | number): boolean {
  return getStatusTone(status) === 'ok'
}

/**
 * Check if a status represents an error state
 */
export function isErrorStatus(status: string | number): boolean {
  return getStatusTone(status) === 'danger'
}

/**
 * Main composable export
 */
export function useStatus() {
  return {
    getStatusClass,
    getStatusTone,
    getStatusText,
    normalizeStatus,
    isActiveStatus,
    isCompletedStatus,
    isErrorStatus,
    StatusStrings,
    States
  }
}
