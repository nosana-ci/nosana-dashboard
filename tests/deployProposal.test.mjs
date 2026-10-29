// deployProposal is a TypeScript module: run with
// `node --experimental-strip-types --test tests/deployProposal.test.mjs`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

// The app imports its own modules without an extension, as Nuxt resolves them.
registerHooks({
  resolve(specifier, context, next) {
    if (/^\.\.?\//.test(specifier) && !/\.\w+$/.test(specifier))
      return next(`${specifier}.ts`, context);
    return next(specifier, context);
  },
});

const {
  baseJob,
  catalogueText,
  gpuFitProblem,
  huggingFaceSearchTerm,
  parseProposal,
  proposalTemplate,
  resolveModel,
  runProposal,
} = await import('../app/utils/deployProposal.ts');

/** Answers fetch from a map of URL prefixes to bodies; anything else is a 404. */
const stubFetch = (routes) => {
  globalThis.fetch = async (url) => {
    const match = Object.keys(routes).find((prefix) => String(url).startsWith(prefix));
    if (!match) return new Response('', { status: 404 });
    const body = routes[match];
    return typeof body === 'string'
      ? new Response(body, { headers: { 'content-type': 'text/markdown' } })
      : Response.json(body);
  };
};

const qwen = {
  id: 'Qwen/Qwen3-8B',
  pipeline_tag: 'text-generation',
  tags: ['transformers', 'safetensors', 'text-generation'],
  gated: false,
  safetensors: { total: 8190735360 },
};
const HF_MODEL = 'https://huggingface.co/api/models/';
const HF_SEARCH = 'https://huggingface.co/api/models?';

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

test('parses a registry model proposal, which needs a model', () => {
  const answer = { kind: 'huggingface', model: 'Qwen/Qwen3-8B', app: 'vllm', name: 'Qwen', why: 'A chat model.' };
  assert.deepEqual(parseProposal(JSON.stringify(answer)), answer);
  assert.throws(() => parseProposal(JSON.stringify({ kind: 'ollama', model: null, name: 'x', why: 'y' })), /needs model/);
  assert.throws(() => parseProposal(JSON.stringify({ ...answer, app: 'tgi' })));
});

test('lists the Ollama library with each size and its smallest GPU', () => {
  const text = catalogueText(
    [],
    [{ name: 'NVIDIA GeForce RTX 4090', vramGb: 24, available: 3, working: 1, markets: [], usd: null }],
    [
      { name: 'qwen3', sizes: [{ tag: '8b', vramMb: 6144 }, { tag: '235b', vramMb: 168960 }], capabilities: ['tools'] },
      { name: 'nomic-embed-text', sizes: [], capabilities: ['embedding'] },
    ],
  );
  assert.match(text, /OLLAMA LIBRARY/);
  assert.match(text, /- qwen3 \| 8b \(6 GB, smallest GPU 24 GB\), 235b \(165 GB, more than any GPU\) \| tools/);
  assert.match(text, /- nomic-embed-text \| one size \| embedding/);
  assert.doesNotMatch(catalogueText([], []), /OLLAMA/);
});

test('resolves an Ollama library model to its quick-start template', async () => {
  stubFetch({});
  const { template, problems } = await resolveModel({ kind: 'ollama', model: 'qwen3:8b', name: 'q', why: 'w' });
  assert.deepEqual(problems, []);
  assert.equal(template.quickStart.model, 'qwen3:8b');
  assert.equal(template.jobDefinition.global.variables.MODEL, 'qwen3:8b');
  const missing = await resolveModel({ kind: 'ollama', model: 'no-such-model:7b', name: 'q', why: 'w' });
  assert.equal(missing.template, null);
  assert.match(missing.problems[0], /not in the Ollama library/);
});

test('resolves a Hugging Face repo, defaulting to its first runtime', async () => {
  stubFetch({ [`${HF_MODEL}Qwen/Qwen3-8B?`]: qwen });
  const { template } = await resolveModel({ kind: 'huggingface', model: 'Qwen/Qwen3-8B', app: null, name: 'q', why: 'w' });
  assert.equal(template.quickStart.app, 'vllm');
  assert.equal(template.jobDefinition.ops[0].args.cmd[0], 'Qwen/Qwen3-8B');
  const ollama = await resolveModel({ kind: 'huggingface', model: 'Qwen/Qwen3-8B', app: 'ollama', name: 'q', why: 'w' });
  assert.match(ollama.problems[0], /cannot be served with ollama, only with vllm or sglang/);
  stubFetch({ [`${HF_MODEL}BAAI/bge-m3?`]: { id: 'BAAI/bge-m3', pipeline_tag: 'sentence-similarity', tags: ['safetensors'] } });
  const embeddings = await resolveModel({ kind: 'huggingface', model: 'BAAI/bge-m3', name: 'b', why: 'w' });
  assert.match(embeddings.problems[0], /answer with kind "job"/);
});

test('answers an unknown Hugging Face repo with servable ones', async () => {
  stubFetch({ [HF_SEARCH]: [qwen, { id: 'someone/qwen-lora', tags: ['peft'] }] });
  const { template, problems } = await resolveModel({ kind: 'huggingface', model: 'Qwen/Qwen3.8-8B', name: 'q', why: 'w' });
  assert.equal(template, null);
  assert.match(problems[0], /"Qwen\/Qwen3\.8-8B" is not on Hugging Face; repos that are: Qwen\/Qwen3-8B$/);
});

test('retries a model pick with what was wrong, then takes its quick-start template', async () => {
  stubFetch({ [`${HF_MODEL}Qwen/Qwen3-8B?`]: qwen, [HF_SEARCH]: [qwen] });
  const answers = [
    { kind: 'huggingface', model: 'Qwen/Qwen3.8-8B', app: 'vllm', name: 'Qwen', why: 'A chat model.' },
    { kind: 'huggingface', model: 'Qwen/Qwen3-8B', app: 'vllm', name: 'Qwen', why: 'A chat model.' },
  ];
  const asked = [];
  const rejected = [];
  const proposal = await runProposal('Qwen3 8B on vLLM', {
    templates: [],
    gpus: [],
    jobs: {},
    ollama: [],
    huggingFace: [],
    resolve: resolveModel,
    async ask(system, messages) {
      asked.push(messages.at(-1).content);
      return JSON.stringify(answers[asked.length - 1]);
    },
    validate: async () => assert.fail('a model pick is not validated'),
    rejected: (label, problems) => rejected.push(problems),
  });
  assert.equal(asked.length, 2);
  assert.match(asked[1], /repos that are: Qwen\/Qwen3-8B/);
  assert.equal(rejected.length, 1);
  assert.equal(proposal.template.quickStart.model, 'Qwen/Qwen3-8B');
  assert.equal(proposal.jobDefinition, proposal.template.jobDefinition);
});

test('rejects a model pick too large for the GPU it names', async () => {
  stubFetch({});
  const gpus = [{ name: 'NVIDIA GeForce RTX 4080', vramGb: 16, available: 1, working: 0, markets: [], usd: null }];
  const answers = [
    { kind: 'ollama', model: 'qwen3:32b', gpuName: 'NVIDIA GeForce RTX 4080', name: 'Qwen', why: 'w' },
    { kind: 'ollama', model: 'qwen3:8b', gpuName: 'NVIDIA GeForce RTX 4080', name: 'Qwen', why: 'w' },
  ];
  let calls = 0;
  const proposal = await runProposal('qwen3 on a 4080', {
    templates: [],
    gpus,
    jobs: {},
    ollama: [],
    huggingFace: [],
    resolve: resolveModel,
    ask: async () => JSON.stringify(answers[calls++]),
    validate: async () => [],
    rejected: () => {},
  });
  assert.equal(calls, 2);
  assert.equal(proposal.template.quickStart.model, 'qwen3:8b');
});

test('ignores a made-up GPU when none are listed, and reads an Ollama size from variantId', async () => {
  stubFetch({});
  let calls = 0;
  const proposal = await runProposal('llama 3.1 70b', {
    templates: [],
    gpus: [],
    jobs: {},
    ollama: [],
    huggingFace: [],
    resolve: resolveModel,
    ask: async () => {
      calls++;
      return JSON.stringify({ kind: 'ollama', model: 'llama3.1', variantId: '70b', gpuName: 'A100', name: 'Llama', why: 'w' });
    },
    validate: async () => [],
    rejected: () => {},
  });
  assert.equal(calls, 1);
  assert.equal(proposal.gpuName, null);
  assert.equal(proposal.template.quickStart.model, 'llama3.1:70b');
});

test('searches Hugging Face for the model a request names, without the words about deploying it', () => {
  assert.equal(huggingFaceSearchTerm('Llama 3.1 8B Instruct on vLLM'), 'llama 3.1 8b instruct');
  assert.equal(huggingFaceSearchTerm('Qwen3 8B on an RTX 4090 with 24GB'), 'qwen3 8b');
  assert.equal(huggingFaceSearchTerm('serve Qwen/Qwen3-8B with sglang'), 'Qwen/Qwen3-8B');
  assert.equal(huggingFaceSearchTerm('Best LLM on a 4090'), '');
});

test('lists the Hugging Face search results with their runtimes and VRAM', () => {
  const text = catalogueText([], [], [], [
    { id: 'Qwen/Qwen3-8B', apps: ['vllm', 'sglang'], vramMb: 20480, gated: false },
    { id: 'meta-llama/Llama-3.1-8B-Instruct', apps: ['vllm', 'sglang'], vramMb: 20480, gated: true },
  ]);
  assert.match(text, /HUGGING FACE, search results/);
  assert.match(text, /- Qwen\/Qwen3-8B \| vllm, sglang \| 20 GB\n/);
  assert.match(text, /- meta-llama\/Llama-3\.1-8B-Instruct \| vllm, sglang \| 20 GB \| gated/);
  assert.doesNotMatch(catalogueText([], []), /HUGGING FACE/);
});

test('keeps only a GPU the request names, and checks the variant', async () => {
  const gpus = [
    { name: 'NVIDIA GeForce RTX 4090', vramGb: 24, available: 1, working: 0, markets: [], usd: null },
    { name: 'NVIDIA H100', vramGb: 80, available: 1, working: 0, markets: [], usd: null },
  ];
  const catalogue = [
    { id: 'comfyui', name: 'ComfyUI', category: 'Image', vramMb: null, variants: [{ id: 'sd15', name: 'SD 1.5', vramMb: 4096 }, { id: 'flux', name: 'Flux', vramMb: 12288 }] },
  ];
  const run = async (request, answers) => {
    const rejected = [];
    let calls = 0;
    const proposal = await runProposal(request, {
      templates: catalogue, gpus, jobs: {}, ollama: [], huggingFace: [],
      resolve: resolveModel,
      ask: async () => JSON.stringify(answers[calls++]),
      validate: async () => [],
      rejected: (label, problems) => rejected.push(...problems),
    });
    return { proposal, rejected };
  };
  const pick = (variantId, gpuName) => ({ kind: 'template', templateId: 'comfyui', variantId, gpuName, name: 'f', why: 'w' });

  const unasked = await run('Flux images', [pick('flux=Flux (12 GB, smallest GPU 24 GB)', 'NVIDIA H100')]);
  assert.equal(unasked.proposal.gpuName, null);
  assert.equal(unasked.proposal.variantId, 'flux');

  const asked = await run('Flux on a 4090', [pick('flux', 'NVIDIA GeForce RTX 4090')]);
  assert.equal(asked.proposal.gpuName, 'NVIDIA GeForce RTX 4090');

  const wrong = await run('Flux images', [pick('flux-dev', null), pick('flux', null)]);
  assert.match(wrong.rejected[0], /variantId "flux-dev" is not a variant of comfyui; its variants are sd15, flux/);
  assert.equal(wrong.proposal.variantId, 'flux');
});

test('refuses an Ollama size the library does not have', async () => {
  stubFetch({});
  const { problems } = await resolveModel({ kind: 'ollama', model: 'clef-flash:flash-9b', name: 'c', why: 'w' });
  assert.match(problems[0], /"clef-flash" has no size "flash-9b"; its sizes are 9b/);
  const fromVariant = await resolveModel({ kind: 'ollama', model: 'clef-flash', variantId: 'flash-9b', name: 'c', why: 'w' });
  assert.equal(fromVariant.template.quickStart.model, 'clef-flash:9b');
});

test('asks for a size when an Ollama model has several', async () => {
  stubFetch({});
  const { template, problems } = await resolveModel({ kind: 'ollama', model: 'qwen3.5', name: 'q', why: 'w' });
  assert.equal(template, null);
  assert.match(problems[0], /"qwen3\.5" comes in sizes 0\.8b, 2b, 4b, 9b/);
});
