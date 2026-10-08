// nosaChat is a TypeScript module: run with
// `node --experimental-strip-types --test tests/nosaChat.test.mjs`.
import test from 'node:test';
import assert from 'node:assert/strict';

import { buildView, parseSse, pendingApproval, toolLabel } from '../app/utils/nosaChat.ts';

const question = { role: 'user', content: 'Deploy llama' };
const askToCreate = {
  role: 'assistant',
  content: [
    { type: 'text', text: 'Creating it on an A100.' },
    { type: 'tool-call', toolCallId: 'c2', toolName: 'postDeploymentsCreate', input: { name: 'llama' } },
    { type: 'tool-approval-request', approvalId: 'a1', toolCallId: 'c2' },
  ],
};

test('parseSse returns complete events and keeps the partial tail', () => {
  const { events, rest } = parseSse('data: {"type":"delta","delta":"Hi"}\n\ndata: {"type":"del');
  assert.deepEqual(events, [{ type: 'delta', delta: 'Hi' }]);
  assert.equal(rest, 'data: {"type":"del');
});

test('a change waiting on the user shows as a pending approval', () => {
  const view = buildView([question, askToCreate]);
  assert.deepEqual(view.map((item) => item.kind), ['user', 'text', 'approval']);
  assert.equal(pendingApproval([question, askToCreate])?.approvalId, 'a1');
});

test('an answered approval is no longer pending, whichever way it went', () => {
  const approved = { role: 'tool', content: [{ type: 'tool-approval-response', approvalId: 'a1', approved: true }] };
  assert.equal(buildView([question, askToCreate, approved]).at(-1).state, 'approved');
  assert.equal(pendingApproval([question, askToCreate, approved]), undefined);

  const denied = { role: 'tool', content: [{ type: 'tool-approval-response', approvalId: 'a1', approved: false }] };
  assert.equal(buildView([question, askToCreate, denied]).at(-1).state, 'declined');
});

test('reads show as steps with their outcome', () => {
  const look = {
    role: 'assistant',
    content: [
      { type: 'tool-call', toolCallId: 'c1', toolName: 'getDeployments', input: {} },
      { type: 'tool-call', toolCallId: 'c3', toolName: 'getCreditsBalance', input: {} },
    ],
  };
  const results = {
    role: 'tool',
    content: [
      { type: 'tool-result', toolCallId: 'c1', toolName: 'getDeployments', output: { type: 'json', value: {} } },
      { type: 'tool-result', toolCallId: 'c3', toolName: 'getCreditsBalance', output: { type: 'error-text', value: 'Unauthorized' } },
    ],
  };
  assert.deepEqual(
    buildView([question, look, results]).filter((i) => i.kind === 'tool').map((i) => i.state),
    ['done', 'failed'],
  );
});

test('toolLabel drops the HTTP method and splits the words', () => {
  assert.equal(toolLabel('postDeploymentsCreate'), 'Deployments create');
  assert.equal(toolLabel('getNodesAvailable-gpus'), 'Nodes available gpus');
  assert.equal(toolLabel('search_knowledge_base'), 'Search knowledge base');
});
