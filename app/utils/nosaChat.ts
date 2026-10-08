/**
 * Nosa's dashboard chat speaks AI SDK model messages: the browser keeps the whole
 * history, sends it every turn, and appends the messages each turn returns. The view
 * is derived from that history, so a reload or a confirmation shows the same thing.
 */

type Part = { type: string; [key: string]: any };

export type NosaMessage =
  | { role: "user"; content: string | Part[] }
  | { role: "assistant"; content: string | Part[] }
  | { role: "tool"; content: Part[] };

export type NosaEvent =
  | { type: "delta"; delta: string }
  | { type: "reasoning"; delta: string }
  | { type: "tool-call"; callId: string; name: string; input: unknown }
  | { type: "tool-result"; callId: string; name: string; output: unknown; failed: boolean }
  | { type: "approval-request"; approvalId: string; callId: string; name: string; input: unknown }
  | { type: "tool-denied"; callId: string; name: string }
  | { type: "done"; text: string; finishReason: string; messages: NosaMessage[] }
  | { type: "error"; error: string };

export type StepState = "running" | "done" | "failed" | "declined";

export type NosaViewItem =
  | { kind: "user"; text: string }
  | { kind: "text"; text: string }
  | { kind: "tool"; callId: string; name: string; state: StepState }
  | {
      kind: "approval";
      approvalId: string;
      callId: string;
      name: string;
      input: unknown;
      state: "pending" | "approved" | "declined";
    };

/** Splits complete `data:` events off an SSE buffer; the remainder waits for more bytes. */
export function parseSse(buffer: string): { events: NosaEvent[]; rest: string } {
  const blocks = buffer.split("\n\n");
  const rest = blocks.pop() ?? "";
  const events = blocks
    .map((block) => block.trim())
    .filter((block) => block.startsWith("data: "))
    .map((block) => JSON.parse(block.slice(6)) as NosaEvent);
  return { events, rest };
}

const textOf = (content: string | Part[]) =>
  typeof content === "string"
    ? content
    : content
        .filter((p) => p.type === "text")
        .map((p) => p.text as string)
        .join("");

function outcomeOf(output: Part | undefined): StepState {
  if (!output) return "done";
  if (output.type === "execution-denied") return "declined";
  if (output.type === "error-text" || output.type === "error-json") return "failed";
  return "done";
}

export function buildView(history: NosaMessage[]): NosaViewItem[] {
  const results = new Map<string, StepState>();
  const answers = new Map<string, boolean>();
  for (const m of history) {
    if (m.role !== "tool") continue;
    for (const p of m.content) {
      if (p.type === "tool-result") results.set(p.toolCallId, outcomeOf(p.output));
      if (p.type === "tool-approval-response") answers.set(p.approvalId, p.approved);
    }
  }

  const items: NosaViewItem[] = [];
  for (const m of history) {
    if (m.role === "user") {
      const text = textOf(m.content);
      if (text) items.push({ kind: "user", text });
      continue;
    }
    if (m.role !== "assistant") continue;
    if (typeof m.content === "string") {
      if (m.content) items.push({ kind: "text", text: m.content });
      continue;
    }

    const approvals = new Map(
      m.content
        .filter((p) => p.type === "tool-approval-request")
        .map((p) => [p.toolCallId as string, p.approvalId as string]),
    );
    for (const p of m.content) {
      if (p.type === "text" && p.text) items.push({ kind: "text", text: p.text });
      if (p.type !== "tool-call") continue;

      const approvalId = approvals.get(p.toolCallId);
      if (!approvalId) {
        items.push({
          kind: "tool",
          callId: p.toolCallId,
          name: p.toolName,
          state: results.get(p.toolCallId) ?? "running",
        });
        continue;
      }
      const answer = answers.get(approvalId);
      const declined = answer === false || results.get(p.toolCallId) === "declined";
      items.push({
        kind: "approval",
        approvalId,
        callId: p.toolCallId,
        name: p.toolName,
        input: p.input,
        state: declined ? "declined" : answer ? "approved" : "pending",
      });
    }
  }
  return items;
}

/** The approval still waiting on the user, if any; at most one is shown at a time. */
export function pendingApproval(history: NosaMessage[]) {
  return buildView(history).find(
    (item): item is Extract<NosaViewItem, { kind: "approval" }> =>
      item.kind === "approval" && item.state === "pending",
  );
}

/** `postDeploymentsCreate` → "Deployments create": the operation id without its method. */
export function toolLabel(name: string): string {
  const words = name
    .replace(/^(get|post|put|patch|delete)(?=[A-Z])/, "")
    .replace(/[-_]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .trim();
  return words ? words[0]!.toUpperCase() + words.slice(1) : name;
}
