// Timeout constants for jobs and deployments
export const MAX_TIMEOUT_HOURS = 100;
// Floor for jobs (>= 1 minute) and SIMPLE/SIMPLE-EXTEND/SCHEDULED deployments (>= 1 minute).
export const MIN_TIMEOUT_HOURS = 0.02; // ~72 seconds
// INFINITE deployment strategy requires >= 60 minutes per API contract.
export const MIN_INFINITE_TIMEOUT_HOURS = 1;

