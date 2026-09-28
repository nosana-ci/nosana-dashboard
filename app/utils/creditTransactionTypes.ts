export type CreditTransactionType =
  | "code_claim"
  | "invitation_claim"
  | "credit_request"
  | "manual_grant"
  | "purchase"
  | "job_refund"
  | "job_debit"
  | "job_extend"
  | "job_settlement"
  | "token_topup"
  | "llm_debit"
  | "llm_refund"
  | string;

const CREDIT_IN_TYPES = new Set([
  "code_claim",
  "invitation_claim",
  "credit_request",
  "manual_grant",
  "purchase",
  "job_refund",
  "token_topup",
  // The unused part of an inference hold, returned when the request settles.
  "llm_refund",
]);

const TYPE_LABELS: Record<string, string> = {
  code_claim: "Code claim",
  invitation_claim: "Invitation",
  credit_request: "Free credits",
  manual_grant: "Grant",
  purchase: "Purchase",
  job_refund: "Refund",
  job_debit: "Spent",
  job_extend: "Extension",
  job_settlement: "Settlement",
  token_topup: "Token topup",
  llm_debit: "Inference",
  llm_refund: "Refund",
};

export const getCreditTransactionLabel = (type: CreditTransactionType): string =>
  TYPE_LABELS[type] ?? type;

export const isCreditTransactionInflow = (type: CreditTransactionType): boolean =>
  CREDIT_IN_TYPES.has(type);
