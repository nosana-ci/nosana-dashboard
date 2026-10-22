// deployProposal is a TypeScript module: run with
// `node --experimental-strip-types --test tests/deployProposal.test.mjs`.
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  baseJob,
  catalogueText,
  gpuFitProblem,
  parseProposal,
  proposalTemplate,
} from '../app/utils/deployProposal.ts';

const job = (vramMb) => ({
  version: '0.1',
  type: 'container',
  meta: { trigger: 'dashboard', system_requirements: { vram_total_mb: vramMb } },
  ops: [{ type: 'container/run', id: 'server', args: { image: 'docker.io/ollama/ollama', gpu: true } }],
});

const templates = [
  {
    id: 'gemma3',
    name: 'Gemma 3 Models',
    category: 'Official|API|LLM|Ollama',
    description: 'Gemma 3 via Ollama.',
    variants: [
      { id: '4b', variant_id: '4b', name: '4B Model', jobDefinition: job(5120) },
      { id: '12b', variant_id: '12b', name: '12B Model', jobDefinition: job(10240) },
    ],
  },
  { id: 'hello-world', name: 'Hello World', category: 'Official', jobDefinition: job(1024) },
];

test('parses a fenced or bare JSON answer into a proposal', () => {
  const answer = { kind: 'template', templateId: 'gemma3', variantId: '4b', name: 'Gemma', why: 'A small chat model.' };
  assert.deepEqual(parseProposal('Here it is:\n```json\n' + JSON.stringify(answer) + '\n```'), answer);
  assert.deepEqual(parseProposal(`Sure. ${JSON.stringify(answer)} Done.`), answer);
});

test('refuses an answer that is not a usable proposal', () => {
  assert.throws(() => parseProposal('no json here'), /not a JSON object/);
  assert.throws(
    () => parseProposal(JSON.stringify({ kind: 'template', name: 'x', why: 'y' })),
    /needs templateId/,
  );
});

test("finds a proposal's template and variant in the catalogue", () => {
  const picked = proposalTemplate({ kind: 'template', templateId: 'gemma3', variantId: '12b', name: 'g', why: 'w' }, templates);
  assert.equal(picked.template.id, 'gemma3');
  assert.equal(picked.variant.name, '12B Model');
  const single = proposalTemplate({ kind: 'template', templateId: 'hello-world', name: 'h', why: 'w' }, templates);
  assert.equal(single.variant, null);
  assert.equal(proposalTemplate({ kind: 'template', templateId: 'nope', name: 'n', why: 'w' }, templates), null);
});

test('lists templates with their variants and VRAM, and GPUs with price and free hosts', () => {
  const text = catalogueText(
    [
      {
        id: 'gemma3', name: 'Gemma 3 Models', category: 'Official|API|LLM|Ollama', description: 'Gemma 3 via Ollama.',
        vramMb: null,
        variants: [{ id: '4b', name: '4B Model', vramMb: 5120 }, { id: '12b', name: '12B Model', vramMb: 10240 }],
      },
      { id: 'hello-world', name: 'Hello World', category: 'Official', vramMb: 1024, variants: [] },
    ],
    [{ name: 'NVIDIA GeForce RTX 4090', vramGb: 24, available: 3, working: 1, markets: [], usd: { min: 0.4, max: 0.5 } }],
  );
  assert.match(text, /- gemma3 \| Gemma 3 Models \| Official\|API\|LLM\|Ollama \| variants: 4b=4B Model \(5 GB, smallest GPU 24 GB\), 12b=12B Model \(10 GB, smallest GPU 24 GB\)/);
  assert.match(text, /- hello-world \| Hello World \| Official \| 1 GB, smallest GPU 24 GB/);
  assert.match(text, /- NVIDIA GeForce RTX 4090 \| 24 GB \| \$0\.400\/h \| 3 hosts free/);
});

test('flags a proposal too large for the GPU it names', () => {
  const catalogue = [
    { id: 'qwen3-5', name: 'Qwen 3.5', category: 'LLM', vramMb: null, variants: [{ id: '9b', name: '9B', vramMb: 9216 }, { id: '27b', name: '27B', vramMb: 19456 }] },
  ];
  const gpus = [{ name: 'NVIDIA GeForce RTX 4080', vramGb: 16, available: 1, working: 0, markets: [], usd: null }];
  const pick = (variantId, gpuName) => ({ kind: 'template', templateId: 'qwen3-5', variantId, gpuName, name: 'q', why: 'w' });
  assert.match(gpuFitProblem(pick('27b', 'NVIDIA GeForce RTX 4080'), catalogue, gpus), /needs 19 GB of VRAM but the NVIDIA GeForce RTX 4080 has 16 GB/);
  assert.equal(gpuFitProblem(pick('9b', 'NVIDIA GeForce RTX 4080'), catalogue, gpus), null);
  assert.equal(gpuFitProblem(pick('27b', null), catalogue, gpus), null);
  assert.match(gpuFitProblem(pick('9b', 'RTX 9999'), catalogue, gpus), /not in the GPU list/);
});

test('finds the job definition of the template to adapt', () => {
  const jobs = { 'gemma3:4b': job(5120), 'gemma3:12b': job(10240), 'hello-world': job(1024) };
  assert.equal(baseJob(jobs, 'gemma3', '12b'), jobs['gemma3:12b']);
  assert.equal(baseJob(jobs, 'gemma3', null), jobs['gemma3:4b']);
  assert.equal(baseJob(jobs, 'hello-world'), jobs['hello-world']);
  assert.equal(baseJob(jobs, 'nope'), null);
});
