// quickStart is a TypeScript module: run with
// `node --experimental-strip-types --test tests/quickStart.test.mjs`.
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
  formatCount,
  formatParams,
  huggingFaceApps,
  huggingFaceCardBody,
  huggingFaceJob,
  huggingFaceTemplate,
  huggingFaceVramMb,
  isOllamaModelRef,
  loadHuggingFaceTemplate,
  loadOllamaLibrary,
  loadOllamaTemplate,
  loadQuickStartTemplate,
  ollamaJob,
  ollamaSizeParams,
  ollamaTemplate,
  ollamaVramMb,
  parseQuickStartId,
  parseQuickStartQuery,
  quickStartQuery,
  quickStartWithVariant,
  searchOllamaLibrary,
} = await import('../app/utils/quickStart.ts');

const library = await loadOllamaLibrary();

const qwen = {
  id: 'Qwen/Qwen3-8B',
  pipeline_tag: 'text-generation',
  library_name: 'transformers',
  tags: ['transformers', 'safetensors', 'qwen3', 'text-generation'],
  gated: false,
  safetensors: { total: 8190735360 },
};

const qwenGguf = {
  id: 'Qwen/Qwen3-8B-GGUF',
  pipeline_tag: 'text-generation',
  tags: ['gguf', 'text-generation'],
  gguf: { total: 8190735360 },
};

/** Answers fetch from a map of URL prefixes to bodies; anything else is a 404. */
const stubFetch = (routes) => {
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    const match = Object.keys(routes).find((prefix) => String(url).startsWith(prefix));
    if (!match) return new Response('', { status: 404 });
    const body = routes[match];
    return typeof body === 'string'
      ? new Response(body, { headers: { 'content-type': 'text/markdown' } })
      : Response.json(body);
  };
  return calls;
};

test('the Ollama library search matches names first, then descriptions', () => {
  const top = searchOllamaLibrary(library, '');
  assert.equal(top.length, 30);
  assert.equal(top[0].name, 'llama3.1');

  const [first] = searchOllamaLibrary(library, 'deepseek-r1');
  assert.equal(first.name, 'deepseek-r1');

  // A typed tag searches the model's name.
  assert.equal(searchOllamaLibrary(library, 'deepseek-r1:7b')[0].name, 'deepseek-r1');

  const meta = searchOllamaLibrary(library, 'from Meta');
  assert.ok(meta.length > 0);
  assert.ok(meta.every((model) => /meta/i.test(model.name + model.description)));

  // Before the library loads there is nothing to match.
  assert.deepEqual(searchOllamaLibrary([], 'qwen3'), []);
});

test('an Ollama model reference is a name with an optional tag', () => {
  assert.ok(isOllamaModelRef('qwen3:8b'));
  assert.ok(isOllamaModelRef('llama3.1'));
  assert.ok(isOllamaModelRef('gpt-oss:20b'));
  assert.ok(!isOllamaModelRef('hello world'));
  assert.ok(!isOllamaModelRef('Qwen/Qwen3-8B'));
});

test('Ollama size tags give a parameter count and a VRAM estimate', () => {
  assert.equal(ollamaSizeParams('8b'), 8e9);
  assert.equal(ollamaSizeParams('2x7b'), 14e9);
  assert.equal(ollamaSizeParams('335m'), 335e6);
  assert.equal(ollamaSizeParams('e4b'), 8e9);
  assert.equal(ollamaSizeParams('latest'), null);

  // 8B at ~0.6 bytes a parameter, plus a quarter for the cache: 6 GB.
  assert.equal(ollamaVramMb('qwen3:8b'), 6 * 1024);
  assert.equal(ollamaVramMb('qwen3:8b-q8_0'), 6 * 1024);
  // A 27B Q4 model lands near the 23 GB the templates ask for.
  assert.equal(ollamaVramMb('gemma3:27b'), 19 * 1024);
  // Small models still get a usable floor; a tag without a size gets no guess.
  assert.equal(ollamaVramMb('all-minilm:335m'), 4 * 1024);
  assert.equal(ollamaVramMb('nomic-embed-text:v1.5'), null);
  assert.equal(ollamaVramMb('qwen3'), null);
});

test('an Ollama job pulls the model as a resource, like the templates', () => {
  const job = ollamaJob('qwen3:8b', 6144);
  assert.equal(job.global.variables.MODEL, 'qwen3:8b');
  assert.equal(job.meta.system_requirements.vram_total_mb, 6144);
  const [op] = job.ops;
  assert.equal(op.args.image, 'docker.io/ollama/ollama:0.40.2');
  assert.deepEqual(op.args.resources, [{ type: 'Ollama', model: '%%global.variables.MODEL%%' }]);
  assert.equal(op.args.expose[0].port, 11434);
  assert.equal(op.args.expose[0].health_checks[0].path, '/api/tags');

  // Without a size there is no requirement to state.
  assert.equal(ollamaJob('qwen3', null).meta.system_requirements, undefined);
});

test('Hugging Face runtimes follow the weights: safetensors chat models get vLLM and SGLang, GGUF gets Ollama', () => {
  assert.deepEqual(huggingFaceApps(qwen), ['vllm', 'sglang']);
  assert.deepEqual(huggingFaceApps(qwenGguf), ['ollama']);
  assert.deepEqual(
    huggingFaceApps({ ...qwen, tags: [...qwen.tags, 'gguf'] }),
    ['vllm', 'sglang', 'ollama'],
  );
  // A classifier or embedding repo has no chat runtime here.
  assert.deepEqual(huggingFaceApps({ ...qwen, pipeline_tag: 'text-classification' }), []);
  assert.deepEqual(huggingFaceApps({ ...qwen, pipeline_tag: 'image-text-to-text' }), ['vllm', 'sglang']);
});

test('Hugging Face VRAM depends on how the weights are stored', () => {
  // 8.2B in bf16: 15.3 GiB of weights, 19.1 GiB with the cache → 20 GB.
  assert.equal(huggingFaceVramMb(qwen, 'vllm'), 20 * 1024);
  assert.equal(huggingFaceVramMb({ ...qwen, id: 'Qwen/Qwen3-8B-FP8' }, 'vllm'), 10 * 1024);
  assert.equal(huggingFaceVramMb({ ...qwen, tags: [...qwen.tags, 'awq'] }, 'vllm'), 6 * 1024);
  // GGUF weights are counted at their quantised size.
  assert.equal(huggingFaceVramMb(qwenGguf, 'ollama'), 6 * 1024);
  assert.equal(huggingFaceVramMb({ id: 'x/unknown', tags: [] }, 'vllm'), null);
});

test('a vLLM job serves the repo id on port 8000 and asks for a token only when gated', () => {
  const job = huggingFaceJob(qwen, 'vllm');
  const [op] = job.ops;
  assert.equal(op.args.image, 'docker.io/vllm/vllm-openai:v0.31.0');
  assert.deepEqual(op.args.cmd, ['Qwen/Qwen3-8B', '--port', '8000', '--max-model-len', '16384']);
  assert.equal(op.args.env, undefined);
  assert.equal(op.args.expose[0].port, 8000);
  assert.equal(op.args.expose[0].health_checks[0].path, '/health');
  assert.equal(job.meta.system_requirements.vram_total_mb, 20 * 1024);

  // Gated: the token given, trimmed, or a placeholder marking where it goes.
  const gated = { ...qwen, gated: 'auto' };
  assert.deepEqual(huggingFaceJob(gated, 'vllm').ops[0].args.env, { HF_TOKEN: '<your-hf-token>' });
  assert.deepEqual(huggingFaceJob(gated, 'sglang', ' hf_abc ').ops[0].args.env, { HF_TOKEN: 'hf_abc' });
});

test('an SGLang job launches the server itself; an Ollama job pulls hf.co/<repo>', () => {
  const sglang = huggingFaceJob(qwen, 'sglang');
  assert.equal(sglang.ops[0].args.image, 'docker.io/lmsysorg/sglang:v0.5.21');
  assert.deepEqual(sglang.ops[0].args.cmd.slice(0, 5), [
    'python3', '-m', 'sglang.launch_server', '--model-path', 'Qwen/Qwen3-8B',
  ]);
  assert.ok(sglang.ops[0].args.cmd.includes('--host'));
  assert.equal(sglang.ops[0].args.expose[0].port, 30000);

  const ollama = huggingFaceJob(qwenGguf, 'ollama');
  assert.equal(ollama.global.variables.MODEL, 'hf.co/Qwen/Qwen3-8B-GGUF');
  assert.equal(ollama.ops[0].args.image, 'docker.io/ollama/ollama:0.40.2');
});

test('an Ollama template carries its selection, a readme, and the library sizes as variants', () => {
  const ollama = ollamaTemplate('qwen3:8b', library, 'The card.');
  assert.equal(ollama.id, 'quickstart:ollama:qwen3:8b');
  assert.equal(ollama.name, 'qwen3 - 8b');
  assert.equal(ollama.category, 'Ollama|LLM');
  assert.deepEqual(ollama.quickStart, { source: 'ollama', model: 'qwen3:8b', card: 'The card.' });
  assert.match(ollama.readme, /ollama\.com\/library\/qwen3\b[\s\S]*The card\./);
  assert.equal(ollama.jobDefinition.global.variables.MODEL, 'qwen3:8b');
  assert.equal(ollama.selectedVariant.variant_id, '8b');
  assert.ok(ollama.variants.length > 3);
  assert.equal(ollama.variants[0].jobDefinition.global.variables.MODEL, 'qwen3:0.6b');

  // No tag: the first size. An unlisted tag or model: as typed, no variants.
  assert.equal(ollamaTemplate('qwen3', library).quickStart.model, 'qwen3:0.6b');
  const typed = ollamaTemplate('qwen3:8b-q8_0', library);
  assert.equal(typed.name, 'qwen3:8b-q8_0');
  assert.equal(typed.variants, undefined);
  assert.equal(ollamaTemplate('made-up:1b', library).quickStart.model, 'made-up:1b');

  // Only effective sizes listed: the untagged model stays the default.
  const bolt = ollamaTemplate('nemotron-3.5-bolt', [{ name: 'nemotron-3.5-bolt', sizes: ['e4b'] }]);
  assert.equal(bolt.quickStart.model, 'nemotron-3.5-bolt:latest');
  assert.deepEqual(bolt.variants.map((v) => v.variant_id), ['latest', 'e4b']);
});

test('a Hugging Face template carries the hub record, and the runtimes as variants', () => {
  const hf = huggingFaceTemplate({ ...qwen, gated: true }, 'vllm', 'The card.');
  assert.equal(hf.id, 'quickstart:huggingface:vllm:Qwen/Qwen3-8B');
  assert.equal(hf.name, 'Qwen3-8B - vLLM');
  assert.equal(hf.category, 'Hugging Face|LLM|vLLM');
  assert.match(hf.description, /gated/);
  assert.match(hf.readme, /huggingface\.co\/Qwen\/Qwen3-8B[\s\S]*The card\./);
  assert.deepEqual(hf.variants.map((v) => v.variant_id), ['vllm', 'sglang']);
  assert.equal(hf.selectedVariant.name, 'vLLM');
  assert.equal(hf.quickStart.app, 'vllm');
  assert.equal(hf.quickStart.details.id, 'Qwen/Qwen3-8B');

  // With a token the job carries it and the description no longer asks for one.
  const withToken = huggingFaceTemplate({ ...qwen, gated: true }, 'vllm', '', 'hf_abc');
  assert.doesNotMatch(withToken.description, /gated/);
  assert.deepEqual(withToken.jobDefinition.ops[0].args.env, { HF_TOKEN: 'hf_abc' });

  // One runtime only: no selector.
  assert.equal(huggingFaceTemplate(qwenGguf, 'ollama').variants, undefined);
});

test('picking a variant rebuilds the template for that size or runtime', async () => {
  const ollama = ollamaTemplate('qwen3:8b', library, 'The card.');
  const bigger = await quickStartWithVariant(ollama, ollama.variants.find((v) => v.variant_id === '32b'));
  assert.equal(bigger.quickStart.model, 'qwen3:32b');
  assert.equal(bigger.name, 'qwen3 - 32b');
  assert.match(bigger.readme, /The card\./);

  const hf = huggingFaceTemplate(qwen, 'vllm', 'The card.');
  const sglang = await quickStartWithVariant(hf, hf.variants[1]);
  assert.equal(sglang.quickStart.app, 'sglang');
  assert.equal(sglang.jobDefinition.ops[0].args.expose[0].port, 30000);
  assert.match(sglang.readme, /The card\./);

  // A gated repo keeps its token on another runtime.
  const gated = huggingFaceTemplate({ ...qwen, gated: true }, 'vllm', '', 'hf_abc');
  const gatedSglang = await quickStartWithVariant(gated, gated.variants[1]);
  assert.deepEqual(gatedSglang.jobDefinition.ops[0].args.env, { HF_TOKEN: 'hf_abc' });

  // Not a quick-start variant: left to the templates.
  assert.equal(await quickStartWithVariant(hf, { id: 'clef-27b', variant_id: '27b', name: '27B' }), null);
  assert.equal(await quickStartWithVariant({ id: 'clef', name: 'Clef' }, hf.variants[1]), null);
});

test('a quick-start id names its selection', () => {
  assert.deepEqual(parseQuickStartId('quickstart:ollama:qwen3:8b'), { source: 'ollama', model: 'qwen3:8b' });
  assert.deepEqual(parseQuickStartId('quickstart:huggingface:vllm:Qwen/Qwen3-8B'), {
    source: 'huggingface', model: 'Qwen/Qwen3-8B', app: 'vllm',
  });
  assert.equal(parseQuickStartId('clef-27b'), null);
  assert.equal(parseQuickStartId('quickstart:huggingface:tgi:x'), null);
  // Only ids the quick start made.
  assert.equal(parseQuickStartId('template:ollama:qwen3:8b'), null);
});

test('the page address round-trips a selection and rejects a broken one', () => {
  const hf = { source: 'huggingface', model: 'Qwen/Qwen3-8B', app: 'vllm' };
  assert.deepEqual(quickStartQuery(hf), { quickstart: 'huggingface', model: 'Qwen/Qwen3-8B', app: 'vllm' });
  assert.deepEqual(parseQuickStartQuery(quickStartQuery(hf)), hf);

  const ollama = { source: 'ollama', model: 'qwen3:8b' };
  assert.deepEqual(quickStartQuery(ollama), { quickstart: 'ollama', model: 'qwen3:8b' });
  assert.deepEqual(parseQuickStartQuery({ ...quickStartQuery(ollama), app: 'vllm' }), ollama);

  assert.equal(parseQuickStartQuery({}), null);
  assert.equal(parseQuickStartQuery({ quickstart: 'huggingface', model: 'Qwen/Qwen3-8B' }), null);
  assert.equal(parseQuickStartQuery({ quickstart: 'huggingface', model: 'x', app: 'tgi' }), null);
  assert.equal(parseQuickStartQuery({ quickstart: 'github', model: 'x' }), null);
  assert.equal(parseQuickStartQuery({ quickstart: 'ollama', model: '' }), null);
});

test('counts read the way model cards write them', () => {
  assert.equal(formatParams(8190735360), '8.2B');
  assert.equal(formatParams(751632384), '752M');
  assert.equal(formatParams(405e9), '405B');
  assert.equal(formatCount(9821408), '9.8M');
  assert.equal(formatCount(2083), '2.1k');
  assert.equal(formatCount(30768), '31k');
  assert.equal(formatCount(512), '512');
});

test('a model card loses its front matter and title, and follows the serving notes', () => {
  const card = '---\nlicense: apache-2.0\ntags:\n- a\n---\n\n# Qwen3-8B\n<a href="x"><img src="badge.svg"/></a>\n\n## Highlights\n\nText.\n';
  assert.equal(huggingFaceCardBody(card), '<a href="x"><img src="badge.svg"/></a>\n\n## Highlights\n\nText.');
  assert.equal(huggingFaceCardBody('No front matter\n'), 'No front matter');

  const template = huggingFaceTemplate(qwen, 'vllm', huggingFaceCardBody(card));
  assert.match(template.readme, /call it with[\s\S]*## Highlights/);
  assert.ok(!template.readme.includes('license: apache'));
  assert.ok(!huggingFaceTemplate(qwen, 'vllm').readme.endsWith('\n\n'));
});

test('loading an Ollama model brings its readme from the snapshot, and does without one', async () => {
  stubFetch({ '/quickstart/ollama/qwen3.md': 'The readme.\n' });
  const template = await loadOllamaTemplate('qwen3:8b');
  assert.equal(template.quickStart.model, 'qwen3:8b');
  assert.equal(template.quickStart.card, 'The readme.');
  assert.ok(template.variants.length > 3);

  stubFetch({});
  assert.equal((await loadOllamaTemplate('made-up:1b')).quickStart.card, '');
});

test('loading a Hugging Face model looks the repo up, and refuses a runtime that cannot serve it', async () => {
  const calls = stubFetch({
    'https://huggingface.co/api/models/Qwen/Qwen3-8B': qwen,
    'https://huggingface.co/Qwen/Qwen3-8B/raw/main/README.md': '# Qwen3-8B\nThe card.',
  });
  const template = await loadHuggingFaceTemplate('Qwen/Qwen3-8B', 'vllm');
  assert.equal(template.quickStart.details.id, 'Qwen/Qwen3-8B');
  assert.equal(template.quickStart.card, 'The card.');
  assert.equal(calls.length, 2);

  // A record in hand is not fetched again, and the token goes along.
  const hfCalls = stubFetch({});
  const gated = await loadHuggingFaceTemplate({ ...qwen, gated: true }, 'sglang', 'hf_abc');
  assert.deepEqual(hfCalls, ['https://huggingface.co/Qwen/Qwen3-8B/raw/main/README.md']);
  assert.deepEqual(gated.jobDefinition.ops[0].args.env, { HF_TOKEN: 'hf_abc' });

  await assert.rejects(loadHuggingFaceTemplate(qwenGguf, 'vllm'), /cannot be served with vLLM/);
  stubFetch({});
  await assert.rejects(loadHuggingFaceTemplate('Qwen/Missing', 'vllm'), /Hugging Face answered 404/);
});

test('a quick-start link loads the template it names', async () => {
  stubFetch({});
  const ollama = await loadQuickStartTemplate({ source: 'ollama', model: 'qwen3:8b' });
  assert.equal(ollama.id, 'quickstart:ollama:qwen3:8b');

  stubFetch({ 'https://huggingface.co/api/models/Qwen/Qwen3-8B-GGUF': qwenGguf });
  const hf = await loadQuickStartTemplate({ source: 'huggingface', model: 'Qwen/Qwen3-8B-GGUF', app: 'ollama' });
  assert.equal(hf.id, 'quickstart:huggingface:ollama:Qwen/Qwen3-8B-GGUF');
});
