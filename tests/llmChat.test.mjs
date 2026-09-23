// llmChat is a TypeScript module: run with
// `node --experimental-strip-types --test tests/llmChat.test.mjs`.
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  findChatEndpoints,
  splitReasoning,
  parseStreamLine,
  trimHistory,
  chatHistoryKey,
  hasChatHistory,
} from '../app/utils/llmChat.ts';

const op = (id, expose) => ({ type: 'container/run', id, args: { image: 'x', expose } });

test('findChatEndpoints: health check POSTing a chat body (string or object)', () => {
  const definition = {
    ops: [
      op('vllm', [
        {
          port: 8000,
          health_checks: [
            {
              type: 'http',
              method: 'POST',
              path: '/v1/chat/completions',
              headers: { Authorization: 'Bearer k' },
              body: JSON.stringify({ model: 'Qwen/Qwen3-8B', messages: [{ role: 'user', content: 'hi' }] }),
            },
          ],
        },
      ]),
      op('ollama', [
        {
          port: 11434,
          health_checks: [
            { type: 'http', method: 'POST', path: '/whatever', body: { model: 'llama3.1', messages: [] } },
          ],
        },
      ]),
    ],
  };
  assert.deepEqual(findChatEndpoints(definition), [
    { opId: 'vllm', port: 8000, model: 'Qwen/Qwen3-8B', headers: { Authorization: 'Bearer k' } },
    { opId: 'ollama', port: 11434, model: 'llama3.1', headers: {} },
  ]);
});

test('findChatEndpoints: chat path without a body still counts, with no model', () => {
  const definition = {
    ops: [op('llm', [{ port: 9000, health_checks: [{ type: 'http', method: 'GET', path: '/api/chat' }] }])],
  };
  assert.deepEqual(findChatEndpoints(definition), [{ opId: 'llm', port: 9000, model: null, headers: {} }]);
});

test('findChatEndpoints: ignores plain web ports, number ports and other op types', () => {
  const definition = {
    ops: [
      op('web', [8080, { port: 3000, health_checks: [{ type: 'http', method: 'GET', path: '/health' }] }]),
      op('ws', [{ port: 4000, health_checks: [{ type: 'websocket', expected_response: 'ok' }] }]),
      { type: 'container/create-volume', id: 'vol', args: { name: 'v' } },
    ],
  };
  assert.deepEqual(findChatEndpoints(definition), []);
  assert.deepEqual(findChatEndpoints(null), []);
});

test('splitReasoning: no reasoning', () => {
  assert.deepEqual(splitReasoning(' Hello '), { reasoning: '', answer: 'Hello', thinking: false });
});

test('splitReasoning: complete think block', () => {
  assert.deepEqual(splitReasoning('<think>plan it</think>\n\nAnswer.'), {
    reasoning: 'plan it',
    answer: 'Answer.',
    thinking: false,
  });
});

test('splitReasoning: still thinking while streaming', () => {
  assert.deepEqual(splitReasoning('<think>half a tho'), {
    reasoning: 'half a tho',
    answer: '',
    thinking: true,
  });
});

test('splitReasoning: only a closing tag (template opened it)', () => {
  assert.deepEqual(splitReasoning('plan it</think>Answer.'), {
    reasoning: 'plan it',
    answer: 'Answer.',
    thinking: false,
  });
});

test('parseStreamLine: content, reasoning fields, usage and terminator', () => {
  assert.deepEqual(parseStreamLine('data: {"choices":[{"delta":{"content":"Hi"}}]}'), {
    content: 'Hi',
    reasoning: '',
    usage: null,
  });
  assert.equal(parseStreamLine('data: {"choices":[{"delta":{"reasoning_content":"hm"}}]}').reasoning, 'hm');
  assert.equal(parseStreamLine('data: {"choices":[{"delta":{"reasoning":"hm"}}]}').reasoning, 'hm');
  assert.deepEqual(parseStreamLine('data: {"choices":[],"usage":{"completion_tokens":42}}').usage, {
    completionTokens: 42,
  });
  assert.equal(parseStreamLine('data: [DONE]'), 'done');
  assert.equal(parseStreamLine(''), null);
  assert.equal(parseStreamLine(': keep-alive'), null);
  assert.equal(parseStreamLine('data: {not json'), null);
});

test('trimHistory: drops the oldest turns, always keeps the newest', () => {
  const turns = [
    { role: 'user', content: 'aaaa' },
    { role: 'assistant', content: 'bbbb' },
    { role: 'user', content: 'cccc' },
  ];
  assert.deepEqual(trimHistory(turns, 8), turns.slice(1));
  assert.deepEqual(trimHistory(turns, 100), turns);
  assert.deepEqual(trimHistory([{ role: 'user', content: 'x'.repeat(50) }], 10).length, 1);
});

test('hasChatHistory: only a non-empty saved conversation counts', () => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, v),
  };
  try {
    assert.equal(hasChatHistory('job1'), false);
    store.set(chatHistoryKey('job1'), '[]');
    assert.equal(hasChatHistory('job1'), false);
    store.set(chatHistoryKey('job1'), '[{"id":0,"role":"user","content":"hi","reasoning":""}]');
    assert.equal(hasChatHistory('job1'), true);
    assert.equal(hasChatHistory('job2'), false);
  } finally {
    delete globalThis.localStorage;
  }
  // No storage at all (server render, blocked storage): no history, no throw.
  assert.equal(hasChatHistory('job1'), false);
});

test('findChatEndpoints: vLLM started with --api-key counts, whatever its health check', () => {
  const vllm = (args) => ({ ops: [{ type: 'container/run', id: 'llm', args: { image: 'docker.io/vllm/vllm-openai:v0.26.0', ...args } }] });

  // Positional model, --port, /health check
  assert.deepEqual(
    findChatEndpoints(vllm({
      cmd: ['Org/Model', '--port', '9000', '--api-key', 'secret'],
      expose: [{ port: 9000, health_checks: [{ type: 'http', method: 'GET', path: '/health' }] }],
    })),
    [{ opId: 'llm', port: 9000, model: 'Org/Model', headers: {} }],
  );
  // Key from env, default port, --served-model-name wins, number expose
  assert.deepEqual(
    findChatEndpoints(vllm({
      cmd: '--model Org/Model --served-model-name nice-name',
      env: { VLLM_API_KEY: 'secret' },
      expose: 8000,
    })),
    [{ opId: 'llm', port: 8000, model: 'nice-name', headers: {} }],
  );
  // --api-key=value form
  assert.equal(
    findChatEndpoints(vllm({ cmd: ['vllm', 'serve', 'Org/M', '--api-key=secret'], expose: [8000] }))[0].model,
    'Org/M',
  );
  // No key: plain /health vLLM is not assumed to be chat
  assert.deepEqual(findChatEndpoints(vllm({ cmd: ['Org/M'], expose: [8000] })), []);
  // Key, but the served port isn't exposed
  assert.deepEqual(findChatEndpoints(vllm({ cmd: ['Org/M', '--api-key', 'k'], expose: [9000] })), []);
});
