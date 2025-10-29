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
 * Get consistent status CSS class for any status (string or number)
 */
export function getStatusClass(status: string | number): string {
  // Handle numeric states (job states 0-3)
  if (typeof status === 'number') {
    switch (status) {
      case 0: return 'is-warning'  // QUEUED - Orange
      case 1: return 'is-info'     // RUNNING - Blue  
      case 2: return 'is-success'  // COMPLETED - Green
      case 3: return 'is-dark'     // STOPPED - Gray
      default: return 'is-light'   // UNKNOWN
    }
  }

  // Handle string statuses
  const statusUpper = status?.toString().toUpperCase()
  switch (statusUpper) {
    // Success states - Green
    case 'SUCCESS':
    case 'COMPLETED':
      return 'is-success'
    
    // Running states - Blue
    case 'RUNNING':
    case 'PENDING':
    case 'STARTING':
      return 'is-info'
    
    // Queued/Draft states - Orange  
    case 'QUEUED':
    case 'DRAFT':
      return 'is-warning'
    
    // Stopping states - Black
    case 'STOPPING':
      return 'is-dark'
    
    // Error/Failed states - Red
    case 'FAILED':
    case 'YAML_ERROR':
    case 'ERROR':
    case 'INSUFFICIENT_FUNDS':
      return 'is-danger'
    
    // Stopped/Archived states - Gray/Black
    case 'STOPPED':
    case 'ARCHIVED':
      return 'is-dark'
    
    // Revision states
    case 'ACTIVE':
      return 'is-info'     // Blue for active (like running)
    case 'INACTIVE':
      return 'is-dark'     // Black for inactive
    
    // Endpoint states
    case 'ONLINE':
      return 'is-success'  // Green for online
    case 'OFFLINE':
      return 'is-dark'     // Gray for offline
    case 'UNKNOWN':
    case 'LOADING':
      return 'is-warning'  // Orange for unknown/loading
    
    default:
      return 'is-light'
  }
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
  const normalized = normalizeStatus(status)
  return [
    StatusStrings.COMPLETED,
    StatusStrings.SUCCESS
  ].includes(normalized as any)
}

/**
 * Check if a status represents an error state
 */
export function isErrorStatus(status: string | number): boolean {
  const normalized = normalizeStatus(status)
  return [
    StatusStrings.FAILED,
    StatusStrings.YAML_ERROR,
    StatusStrings.ERROR,
    StatusStrings.INSUFFICIENT_FUNDS
  ].includes(normalized as any)
}

/**
 * Main composable export
 */
export function useStatus() {
  return {
    getStatusClass,
    getStatusText,
    normalizeStatus,
    isActiveStatus,
    isCompletedStatus,
    isErrorStatus,
    StatusStrings,
    States
  }
}