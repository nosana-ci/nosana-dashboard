<template>
  <div class="jdb">
    <!-- Operations -->
    <div class="jdb-ops">
      <div v-for="(op, idx) in working.ops" :key="idx" class="op" :class="{ collapsed: !op._open }">
        <div class="op-head">
          <span class="op-icon" aria-hidden="true">
            <svg v-if="op.type === 'container/run'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="12" rx="2" /><path d="M3 11h18M8 7V5h8v2" /></svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></svg>
          </span>
          <div class="idfield">
            <label :for="`op-id-${idx}`">{{ op.type === 'container/run' ? 'Run container' : 'Create volume' }}</label>
            <input :id="`op-id-${idx}`" v-model="op.id" class="idinput" spellcheck="false" placeholder="my-op" aria-label="Operation id" />
            <span v-if="op.id" class="chk" :class="idValid(op.id) ? 'ok' : 'warn'" :title="idValid(op.id) ? 'Unique, no spaces or dots' : 'No spaces or dots'">
              <svg v-if="idValid(op.id)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /></svg>
            </span>
          </div>
          <div class="op-actions">
            <button class="icon-btn" :aria-label="op._open ? 'Collapse' : 'Expand'" @click="op._open = !op._open">
              <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6" /></svg>
            </button>
            <button class="icon-btn danger" aria-label="Delete operation" @click="removeOp(idx)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13" /></svg>
            </button>
          </div>
        </div>

        <div v-show="op._open" class="op-body">
          <!-- Volume operation -->
          <template v-if="op.type === 'container/create-volume'">
            <div class="essentials">
              <div class="field">
                <div class="lab"><span class="name">Name <span class="req">required</span></span><span class="desc">Referenced by other operations under <code>volumes</code>.</span></div>
                <div class="control"><input v-model="op.args.name" class="jinput mono" placeholder="model-cache" /></div>
              </div>
            </div>
          </template>

          <!-- Container run operation -->
          <template v-else>
            <!-- ESSENTIALS — always visible -->
            <div class="essentials is-grid">
              <div class="field stack">
                <div class="lab"><span class="name">Image <span class="req">required</span></span><span class="desc">The container image to run.</span></div>
                <div class="control">
                  <input v-model="op.args.image" class="jinput mono" placeholder="e.g. ubuntu:22.04" />
                  <span v-if="!op.args.image" class="hint warn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /></svg> Image is required</span>
                </div>
              </div>

              <div class="field stack">
                <div class="lab"><span class="name">Command</span><span class="desc">Leave empty to use the image default.</span></div>
                <div class="control"><input v-model="op.args.cmd" class="jinput mono" placeholder="e.g. python app.py --port 9000" /></div>
              </div>

              <div class="field stack wide">
                <div class="lab"><span class="name">Ports</span><span class="desc">Each port gets a public HTTPS URL.</span></div>
                <div class="control">
                  <p v-if="op.args._exposePassthrough" class="passthrough-note">
                    This operation uses advanced port options set in JSON (shared values or spreads). Switch to the JSON view to edit them.
                  </p>
                  <template v-else>
                    <div v-if="op.args.expose.length" class="port-list">
                      <div v-for="(p, pi) in op.args.expose" :key="pi" class="port-card">
                        <div class="port-top">
                          <div class="port-input">
                            <span class="pfx">:</span>
                            <input v-model="p.port" type="number" placeholder="9000" />
                          </div>
                          <button class="row-rm" aria-label="Remove port" @click="op.args.expose.splice(pi, 1)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13" /></svg></button>
                        </div>
                        <div class="hc-line">
                          <button v-if="!p.hc" class="linkbtn" @click="addHealthCheck(p)">+ Add health check</button>
                          <template v-else>
                            <div class="hc-head">
                              <span class="hc-title">Health check</span>
                              <button class="linkbtn danger" @click="p.hc = null">Remove</button>
                            </div>
                            <div class="hc-fields">
                              <div class="hc-field">
                                <span class="hc-label">Check</span>
                                <select v-model="p.hc.type" class="jselect">
                                  <option value="http">HTTP</option>
                                  <option value="websocket">WebSocket</option>
                                </select>
                                <UIToggleSwitch v-model="p.hc.continuous" small class="hc-keep">Keep checking</UIToggleSwitch>
                              </div>
                              <div v-if="p.hc.type === 'http'" class="hc-grid">
                                <input v-model="p.hc.path" class="jinput mono" placeholder="path — /health" />
                                <select v-model="p.hc.method" class="jselect">
                                  <option v-for="m in HTTP_METHODS" :key="m" :value="m">{{ m }}</option>
                                </select>
                                <input v-model.number="p.hc.expected_status" type="number" class="jinput" placeholder="200" />
                              </div>
                              <input v-else v-model="p.hc.expected_response" class="jinput mono" placeholder="expected response text" />
                            </div>
                          </template>
                        </div>
                      </div>
                    </div>
                    <button class="add-btn" @click="op.args.expose.push({ port: '', hc: null })"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg> Expose a port</button>
                  </template>
                </div>
              </div>
            </div>

            <!-- ENVIRONMENT — collapsed by default -->
            <div class="fold" :class="{ open: op._ui.env }">
              <button class="fold-head" :aria-expanded="op._ui.env" @click="op._ui.env = !op._ui.env">
                <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                <span class="ft">Environment variables</span>
                <span class="fs">{{ envSummary(op) }}</span>
              </button>
              <div v-show="op._ui.env" class="fold-body">
                <div v-if="op.args.env.length" class="rows">
                  <div v-for="(e, ei) in op.args.env" :key="ei" class="row">
                    <input v-model="e.key" class="jinput mono env-key" placeholder="KEY" />
                    <span class="eq">=</span>
                    <input v-model="e.value" class="jinput mono" placeholder="value" />
                    <button class="row-rm" aria-label="Remove variable" @click="op.args.env.splice(ei, 1)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13" /></svg></button>
                  </div>
                </div>
                <button class="add-btn" @click="op.args.env.push({ key: '', value: '' })"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg> Add variable</button>
              </div>
            </div>

            <!-- MODELS & DATA — collapsed by default -->
            <div class="fold" :class="{ open: op._ui.data }">
              <button class="fold-head" :aria-expanded="op._ui.data" @click="op._ui.data = !op._ui.data">
                <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                <span class="ft">Models &amp; data</span>
                <span class="fs">{{ dataSummary(op) }}</span>
              </button>
              <div v-show="op._ui.data" class="fold-body">
                <div v-if="op.args.resources.length" class="rows">
                  <div v-for="(r, ri) in op.args.resources" :key="ri">
                    <div v-if="r.type === '_raw'" class="passthrough-note">Advanced data source set in JSON — switch to the JSON view to edit it.</div>
                    <div v-else class="res">
                      <div class="res-head">
                        <span class="res-type">{{ r.type === 'HF' ? 'Hugging Face' : r.type === 'S3' ? 'S3 bucket' : 'Ollama' }}</span>
                        <button class="row-rm" aria-label="Remove data source" @click="op.args.resources.splice(ri, 1)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13" /></svg></button>
                      </div>

                      <!-- Hugging Face -->
                      <div v-if="r.type === 'HF'" class="res-body">
                        <div class="res-field wide"><label>Repository <span class="req">required</span></label><input v-model="r.repo" class="jinput mono" placeholder="org/model-name" /></div>
                        <div class="res-field"><label>Revision</label><input v-model="r.revision" class="jinput mono" placeholder="branch, tag or commit (optional)" /></div>
                        <div class="res-field"><label>Mount path</label><input v-model="r.target" class="jinput mono" placeholder="/models" /></div>
                        <button class="linkbtn res-adv-toggle" @click="r._adv = !r._adv">{{ r._adv ? 'Hide' : 'Show' }} advanced</button>
                        <div v-if="r._adv" class="res-adv">
                          <div class="res-field"><label>Access token</label><input v-model="r.accessToken" type="password" class="jinput mono" placeholder="hf_… (for private repos)" /></div>
                          <div class="res-field"><label>Files</label><input v-model="r.files" class="jinput mono" placeholder="comma-separated paths (optional)" /></div>
                        </div>
                      </div>

                      <!-- S3 -->
                      <div v-else-if="r.type === 'S3'" class="res-body">
                        <div class="res-field"><label>Bucket <span class="req">required</span></label><input v-model="r.bucket" class="jinput mono" placeholder="my-bucket" /></div>
                        <div class="res-field"><label>Mount path</label><input v-model="r.target" class="jinput mono" placeholder="/data" /></div>
                        <button class="linkbtn res-adv-toggle" @click="r._adv = !r._adv">{{ r._adv ? 'Hide' : 'Show' }} advanced</button>
                        <div v-if="r._adv" class="res-adv">
                          <div class="res-field wide"><label>Endpoint URL</label><input v-model="r.url" class="jinput mono" placeholder="https://s3.amazonaws.com (optional)" /></div>
                          <div class="res-field"><label>Access</label>
                            <UIToggleSwitch v-model="r.allowWrite" small>{{ r.allowWrite ? 'Read & write' : 'Read only' }}</UIToggleSwitch>
                          </div>
                          <div class="res-field"><label>Files</label><input v-model="r.files" class="jinput mono" placeholder="comma-separated paths (optional)" /></div>
                          <div class="res-subhead">Credentials — only for private buckets</div>
                          <div class="res-field"><label>Region</label><input v-model="r.region" class="jinput mono" placeholder="us-east-1" /></div>
                          <div class="res-field"><label>Access key ID</label><input v-model="r.accessKeyId" class="jinput mono" placeholder="AKIA…" /></div>
                          <div class="res-field wide"><label>Secret key</label><input v-model="r.secretAccessKey" type="password" class="jinput mono" placeholder="••••••••" /></div>
                        </div>
                      </div>

                      <!-- Ollama -->
                      <div v-else class="res-body">
                        <div class="res-field"><label>Model <span class="req">required</span></label><input v-model="r.model" class="jinput mono" placeholder="llama3.1:8b" /></div>
                        <div class="res-field"><label>Mount path</label><input v-model="r.target" class="jinput mono" placeholder="/models" /></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="add-menu-wrap">
                  <button class="add-btn" @click="op._resMenu = !op._resMenu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg> Add data source</button>
                  <div v-if="op._resMenu" class="add-menu">
                    <button @click="addResource(op, 'HF')"><b>Hugging Face</b><small>Mount a model or dataset repo</small></button>
                    <button @click="addResource(op, 'S3')"><b>S3 bucket</b><small>Mount objects from S3-compatible storage</small></button>
                    <button @click="addResource(op, 'Ollama')"><b>Ollama model</b><small>Pull an Ollama model by name</small></button>
                  </div>
                </div>
              </div>
            </div>

            <!-- ADVANCED — collapsed by default -->
            <div class="fold" :class="{ open: op._ui.adv }">
              <button class="fold-head" :aria-expanded="op._ui.adv" @click="op._ui.adv = !op._ui.adv">
                <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                <span class="ft">Advanced</span>
                <span class="fs">{{ advSummary(op) }}</span>
              </button>
              <div v-show="op._ui.adv" class="fold-body">
                <div class="field">
                  <div class="lab"><span class="name">Entrypoint</span><span class="desc">Overrides the image entrypoint.</span></div>
                  <div class="control"><input v-model="op.args.entrypoint" class="jinput mono" placeholder="e.g. /bin/sh -c" /></div>
                </div>

                <div class="field">
                  <div class="lab"><span class="name">Restart policy</span><span class="desc">What to do when the container exits.</span></div>
                  <div class="control">
                    <select v-if="op.args._restartManaged" v-model="op.args.restart_policy" class="jselect full">
                      <option v-for="[val, label] in RESTART" :key="val" :value="val">{{ label }}</option>
                    </select>
                    <p v-else class="passthrough-note">Advanced restart policy set in JSON — switch to the JSON view to edit it.</p>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Add operation -->
    <div class="add-menu-wrap jdb-addop">
      <button class="add-btn big" @click="addOpMenu = !addOpMenu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
        Add operation
      </button>
      <div v-if="addOpMenu" class="add-menu">
        <button @click="addOp('container/run')"><b>Run a container</b><small>Pull an image and run it on a GPU node</small></button>
        <button @click="addOp('container/create-volume')"><b>Create a volume</b><small>A named disk shared between operations</small></button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { JobDefinition } from '@nosana/kit';
import { useToast } from 'vue-toastification';
import UIToggleSwitch from '~/components/UI/ToggleSwitch.vue';

const props = defineProps<{
  modelValue: JobDefinition | null | string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: JobDefinition | null | string];
}>();

const toast = useToast();

const RESTART: [string, string][] = [
  ['no', 'No — run once'],
  ['on-failure', 'On failure'],
  ['always', 'Always'],
  ['unless-stopped', 'Unless stopped'],
];
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE'];

const KNOWN_ARG_KEYS = ['image', 'gpu', 'cmd', 'entrypoint', 'expose', 'env', 'resources', 'restart_policy'];

const rand = () => Math.random().toString(36).slice(2, 7);
const idValid = (id: string) => !!id && /^[^\s.]+$/.test(id);

function toObj(v: any): any {
  if (v && typeof v === 'object') return v;
  if (typeof v === 'string') {
    try {
      const p = JSON.parse(v);
      return p && typeof p === 'object' ? p : null;
    } catch {
      return null;
    }
  }
  return null;
}

/* ---- command/entrypoint: single string in the UI, array in the schema ---- */
// Split a command string into argv, respecting single/double quotes.
function tokenize(str: any): string[] {
  const s = typeof str === 'string' ? str : '';
  const out: string[] = [];
  let cur = '', has = false, quote = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quote) {
      if (quote === '"' && c === '\\' && i + 1 < s.length) cur += s[++i];
      else if (c === quote) quote = '';
      else cur += c;
      continue;
    }
    if (c === '"' || c === "'") { quote = c; has = true; continue; }
    if (/\s/.test(c)) { if (cur !== '' || has) { out.push(cur); cur = ''; has = false; } continue; }
    cur += c;
  }
  if (cur !== '' || has) out.push(cur);
  return out;
}
// Join argv back to an editable string, quoting tokens that need it.
function joinTokens(arr: any[]): string {
  return arr
    .map((t) => {
      const s = String(t);
      return s === '' || /[\s"']/.test(s) ? '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"' : s;
    })
    .join(' ');
}
function argvToStr(v: any): string {
  if (Array.isArray(v)) return joinTokens(v);
  if (typeof v === 'string') return v;
  return '';
}

/* ---- parse: JobDefinition -> editable working model ---- */

function parseEnv(env: any): { key: string; value: string }[] {
  if (!env || typeof env !== 'object') return [];
  return Object.keys(env).map((k) => ({ key: k, value: String(env[k]) }));
}

function parseHealthCheck(hc: any): any {
  if (!hc || typeof hc !== 'object') return null;
  if (hc.type === 'websocket') {
    const { type, expected_response, continuous, ...rest } = hc;
    return { type: 'websocket', expected_response: expected_response ?? '', continuous: !!continuous, path: '/', method: 'GET', expected_status: 200, _extra: Object.keys(rest).length ? rest : undefined };
  }
  const { type, path, method, expected_status, continuous, ...rest } = hc;
  return { type: 'http', path: path ?? '/', method: method ?? 'GET', expected_status: expected_status ?? 200, continuous: !!continuous, expected_response: '', _extra: Object.keys(rest).length ? rest : undefined };
}

function parseExpose(expose: any): { list: any[]; passthrough: boolean } {
  if (expose === undefined || expose === null) return { list: [], passthrough: false };
  const arr = Array.isArray(expose) ? expose : [expose];
  const list: any[] = [];
  for (const e of arr) {
    if (typeof e === 'number') {
      list.push({ port: e, hc: null });
    } else if (e && typeof e === 'object' && e.port !== undefined && !e.__spread__) {
      const { port, health_checks, ...rest } = e;
      const extra: any = { ...rest }; // preserves `type` and any other keys we don't surface
      let hc = null;
      if (Array.isArray(health_checks)) {
        if (health_checks.length === 1) hc = parseHealthCheck(health_checks[0]);
        else if (health_checks.length > 1) extra.health_checks = health_checks; // preserve rare multi-check
      }
      list.push({ port, hc, _extra: Object.keys(extra).length ? extra : undefined });
    } else {
      // spread markers / placeholder strings -> keep the whole expose in passthrough
      return { list: [], passthrough: true };
    }
  }
  return { list, passthrough: false };
}

function splitList(v: any): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === 'string') return v.split(/[,\n]/).map((x) => x.trim()).filter(Boolean);
  return [];
}

function parseResources(res: any): any[] {
  if (!Array.isArray(res)) return [];
  return res.map((r) => {
    if (!r || typeof r !== 'object' || r.__spread__) return { type: '_raw', _raw: r };
    if (r.type === 'HF') {
      const { type, repo, revision, target, files, accessToken, ...rest } = r;
      return {
        type: 'HF', repo: repo ?? '', revision: revision ?? '', target: target ?? '/models',
        files: Array.isArray(files) ? files.join(', ') : (files ?? ''), accessToken: accessToken ?? '',
        _adv: false, _extra: Object.keys(rest).length ? rest : undefined,
      };
    }
    if (r.type === 'S3') {
      const { type, bucket, target, url, allowWrite, files, IAM, ...rest } = r;
      const iam = IAM && typeof IAM === 'object' ? IAM : {};
      return {
        type: 'S3', bucket: bucket ?? '', target: target ?? '/data', url: url ?? '', allowWrite: !!allowWrite,
        files: Array.isArray(files) ? files.join(', ') : (files ?? ''),
        region: iam.REGION ?? '', accessKeyId: iam.ACCESS_KEY_ID ?? '', secretAccessKey: iam.SECRET_ACCESS_KEY ?? '',
        _adv: false, _extra: Object.keys(rest).length ? rest : undefined,
      };
    }
    if (r.type === 'Ollama') {
      const { type, model, target, ...rest } = r;
      return { type: 'Ollama', model: model ?? '', target: target ?? '/models', _extra: Object.keys(rest).length ? rest : undefined };
    }
    return { type: '_raw', _raw: r };
  });
}

function parse(input: any): { ops: any[]; _extraTop: Record<string, any> } {
  const raw = toObj(input) || { version: '0.1', type: 'container', ops: [] };
  const { version, type, ops, ...extraTop } = raw;
  const opsArr: any[] = Array.isArray(ops) ? ops : [];

  const model = opsArr.map((op) => {
    if (op?.type === 'container/create-volume') {
      const { type: _t, id, args, ...extraOp } = op;
      const a = args || {};
      const { name, ...extraArgs } = a;
      return {
        id: id ?? '', type: 'container/create-volume', _open: true, _resMenu: false,
        _ui: { env: false, data: false, adv: false },
        _extraOp: extraOp, args: { name: name ?? '', _extraArgs: extraArgs },
      };
    }

    const { type: _t, id, args, ...extraOp } = op || {};
    const a = args || {};
    const extraArgs: Record<string, any> = {};
    Object.keys(a).forEach((k) => {
      if (!KNOWN_ARG_KEYS.includes(k)) extraArgs[k] = a[k];
    });

    const { list: exposeList, passthrough: exposePass } = parseExpose(a.expose);
    if (exposePass) extraArgs.expose = a.expose;

    let restart = 'no';
    let restartManaged = true;
    if (typeof a.restart_policy === 'string') {
      restart = a.restart_policy;
    } else if (a.restart_policy !== undefined) {
      restartManaged = false;
      extraArgs.restart_policy = a.restart_policy;
    }

    return {
      id: id ?? '', type: 'container/run', _open: true, _resMenu: false,
      _ui: { env: false, data: false, adv: false },
      _extraOp: extraOp,
      args: {
        image: a.image ?? '',
        entrypoint: argvToStr(a.entrypoint),
        cmd: argvToStr(a.cmd),
        restart_policy: restart,
        _restartManaged: restartManaged,
        expose: exposeList,
        _exposePassthrough: exposePass,
        env: parseEnv(a.env),
        resources: parseResources(a.resources),
        _extraArgs: extraArgs,
      },
    };
  });

  return { ops: model, _extraTop: extraTop };
}

/* ---- serialize: working model -> clean JobDefinition ---- */
function serializeHealthCheck(hc: any) {
  const extra = hc._extra || {};
  if (hc.type === 'websocket') {
    return { type: 'websocket', expected_response: hc.expected_response || '', continuous: !!hc.continuous, ...extra };
  }
  return {
    type: 'http', path: hc.path || '/', method: hc.method || 'GET',
    expected_status: Number(hc.expected_status) || 200, continuous: !!hc.continuous, ...extra,
  };
}

function serializeResource(r: any) {
  if (r.type === '_raw') return r._raw;
  const extra = r._extra || {};
  if (r.type === 'HF') {
    const o: any = { type: 'HF', repo: r.repo || '', target: r.target || '/models' };
    if (r.revision) o.revision = r.revision;
    const files = splitList(r.files); if (files.length) o.files = files;
    if (r.accessToken) o.accessToken = r.accessToken;
    return { ...o, ...extra };
  }
  if (r.type === 'S3') {
    const o: any = { type: 'S3', target: r.target || '/data' };
    if (r.bucket) o.bucket = r.bucket;
    if (r.url) o.url = r.url;
    if (r.allowWrite) o.allowWrite = true;
    const files = splitList(r.files); if (files.length) o.files = files;
    const iam: any = {};
    if (r.region) iam.REGION = r.region;
    if (r.accessKeyId) iam.ACCESS_KEY_ID = r.accessKeyId;
    if (r.secretAccessKey) iam.SECRET_ACCESS_KEY = r.secretAccessKey;
    if (Object.keys(iam).length) o.IAM = iam;
    return { ...o, ...extra };
  }
  return { type: 'Ollama', model: r.model || '', target: r.target || '/models', ...extra };
}

function serialize(w: { ops: any[]; _extraTop: Record<string, any> }): JobDefinition {
  const def: any = { version: '0.1', type: 'container', ops: [] };

  for (const op of w.ops) {
    if (op.type === 'container/create-volume') {
      const args: any = { ...(op.args._extraArgs || {}) };
      args.name = op.args.name || '';
      def.ops.push({ type: op.type, id: op.id, ...op._extraOp, args });
      continue;
    }

    const a: any = { ...(op.args._extraArgs || {}) };
    a.image = op.args.image || '';
    a.gpu = true; // every Nosana container runs on a GPU

    const entrypoint = tokenize(op.args.entrypoint);
    if (entrypoint.length) a.entrypoint = entrypoint; else delete a.entrypoint;

    const cmd = tokenize(op.args.cmd);
    if (cmd.length) a.cmd = cmd; else delete a.cmd;

    if (!op.args._exposePassthrough) {
      const ports = (op.args.expose || []).filter((p: any) => p.port !== '' && p.port != null);
      if (ports.length) {
        const mapped = ports.map((p: any) => {
          const extra = p._extra || {};
          const health = p.hc ? [serializeHealthCheck(p.hc)] : undefined;
          if (!health && !Object.keys(extra).length) return Number(p.port);
          const o: any = { port: Number(p.port), ...extra };
          if (health) o.health_checks = health;
          return o;
        });
        // Preserve the `expose: 80` shorthand for a single plain port
        a.expose = mapped.length === 1 && typeof mapped[0] === 'number' ? mapped[0] : mapped;
      } else {
        delete a.expose;
      }
    }

    const env = (op.args.env || []).filter((e: any) => e.key);
    if (env.length) {
      a.env = {};
      env.forEach((e: any) => { a.env[e.key] = e.value; });
    } else {
      delete a.env;
    }

    const res = op.args.resources || [];
    if (res.length) a.resources = res.map(serializeResource); else delete a.resources;

    if (op.args._restartManaged) {
      if (op.args.restart_policy && op.args.restart_policy !== 'no') a.restart_policy = op.args.restart_policy;
      else delete a.restart_policy;
    }

    def.ops.push({ type: op.type, id: op.id, ...op._extraOp, args: a });
  }

  Object.assign(def, w._extraTop);
  return def as JobDefinition;
}

/* ---- two-way sync with modelValue (no feedback loop) ---- */
const working = ref(parse(props.modelValue));
let lastEmitted = '';

watch(
  working,
  () => {
    const out = serialize(working.value);
    lastEmitted = JSON.stringify(out);
    emit('update:modelValue', out);
  },
  { deep: true },
);

watch(
  () => props.modelValue,
  (val) => {
    const obj = toObj(val);
    if (!obj) return; // ignore invalid JSON typed in the JSON tab; keep current model
    const incoming = JSON.stringify(obj);
    if (incoming === lastEmitted) return; // our own echo
    if (incoming === JSON.stringify(serialize(working.value))) return;
    working.value = parse(obj);
  },
  { deep: true },
);

/* ---- summaries for collapsed sections ---- */
function envSummary(op: any): string {
  const n = (op.args.env || []).filter((e: any) => e.key).length;
  return n ? `${n} variable${n > 1 ? 's' : ''}` : 'None set';
}
function dataSummary(op: any): string {
  const n = (op.args.resources || []).filter((r: any) => r.type !== '_raw').length;
  return n ? `${n} source${n > 1 ? 's' : ''}` : 'None';
}
function advSummary(op: any): string {
  const parts: string[] = [];
  if (op.args.entrypoint) parts.push('entrypoint');
  if (!op.args._restartManaged || (op.args.restart_policy && op.args.restart_policy !== 'no')) parts.push('restart policy');
  return parts.length ? parts.join(' · ') : 'Optional';
}

/* ---- editing actions ---- */
const addOpMenu = ref(false);

function newRunOp() {
  return {
    id: 'op-' + rand(), type: 'container/run', _open: true, _resMenu: false,
    _ui: { env: false, data: false, adv: false },
    _extraOp: {},
    args: {
      image: '', entrypoint: '', cmd: '', restart_policy: 'no', _restartManaged: true,
      expose: [], _exposePassthrough: false, env: [], resources: [], _extraArgs: {},
    },
  };
}

function addOp(type: 'container/run' | 'container/create-volume') {
  if (type === 'container/run') {
    working.value.ops.push(newRunOp());
  } else {
    working.value.ops.push({
      id: 'vol-' + rand(), type, _open: true, _resMenu: false,
      _ui: { env: false, data: false, adv: false },
      _extraOp: {}, args: { name: '', _extraArgs: {} },
    });
  }
  addOpMenu.value = false;
}

function removeOp(idx: number) {
  if (working.value.ops.length <= 1) {
    toast.error('A job needs at least one operation');
    return;
  }
  working.value.ops.splice(idx, 1);
}

function addResource(op: any, type: 'HF' | 'S3' | 'Ollama') {
  const base =
    type === 'HF' ? { type: 'HF', repo: '', revision: '', target: '/models', files: '', accessToken: '', _adv: false }
    : type === 'S3' ? { type: 'S3', bucket: '', target: '/data', url: '', allowWrite: false, files: '', region: '', accessKeyId: '', secretAccessKey: '', _adv: false }
    : { type: 'Ollama', model: '', target: '/models' };
  op.args.resources.push(base);
  op._resMenu = false;
}

function addHealthCheck(port: any) {
  port.hc = { type: 'http', path: '/', method: 'GET', expected_status: 200, continuous: false, expected_response: '' };
}

/* ---- validation gate (mirrors the JSON editor's canSave contract) ---- */
function canSave(): boolean {
  const def: any = serialize(working.value);
  if (!def.ops || def.ops.length === 0) {
    toast.error('Add at least one operation');
    return false;
  }
  const ids = new Set<string>();
  for (let i = 0; i < def.ops.length; i++) {
    const op = def.ops[i];
    if (!op.id) {
      toast.error(`Operation ${i + 1}: give it an id`);
      return false;
    }
    if (!idValid(op.id)) {
      toast.error(`Operation "${op.id}": id can't contain spaces or dots`);
      return false;
    }
    if (ids.has(op.id)) {
      toast.error(`Duplicate operation id "${op.id}"`);
      return false;
    }
    ids.add(op.id);
    if (op.type === 'container/run' && !op.args?.image) {
      toast.error(`Operation "${op.id}": add a container image`);
      return false;
    }
    if (op.type === 'container/create-volume' && !op.args?.name) {
      toast.error(`Volume "${op.id}": add a name`);
      return false;
    }
  }
  return true;
}

defineExpose({ canSave });
</script>

<style lang="scss" scoped>
.jdb {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: 2px 2px 8px;
  font-family: $family-sans-serif;
}

.jdb-ops { display: flex; flex-direction: column; gap: 14px; }

/* op card: the same floating panel as the GPU selector beside it */
.op {
  @include soft-panel;
}
.op-head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
}
/* the operation's mark, the same tile the GPU rows use */
.op-icon {
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  background: rgba($secondary, 0.1);
  border: 1px solid rgba($secondary, 0.25);
  color: $secondary-text;
  svg { width: 18px; height: 18px; }
}
/* the kind as an eyebrow, the id as the card's title */
.idfield {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  flex: 1;
  min-width: 0;
  label {
    font-family: $family-monospace;
    font-size: 0.68rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: $text-muted;
  }
  .idinput {
    width: 100%;
    max-width: 280px;
    border: 0;
    border-bottom: 1.5px dashed transparent;
    background: transparent;
    color: $text;
    font-family: $title-family;
    font-weight: 600;
    font-size: 1.05rem;
    letter-spacing: -0.01em;
    padding: 1px 0;
    transition: border-color 0.15s;
    &:hover { border-bottom-color: $border; }
    &:focus { outline: 0; border-bottom-color: $secondary; border-bottom-style: solid; }
  }
  // Only a problem is worth a mark: an id with spaces or dots.
  .chk { display: none; }
  .chk.warn { display: inline-flex; color: #b8830a; svg { width: 14px; height: 14px; } }
}
.op-actions { display: flex; gap: 2px; flex: none; }
.icon-btn {
  width: 30px; height: 30px;
  border: 0; background: transparent;
  color: $text-muted;
  border-radius: 7px;
  display: grid; place-items: center;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  svg { width: 16px; height: 16px; }
  &:hover { background: rgba(0, 0, 0, 0.05); color: $text; }
  &.danger:hover { background: rgba(#e5484d, 0.1); color: #e5484d; }
  .chev { transition: transform 0.18s ease; }
}
.op.collapsed .chev { transform: rotate(-90deg); }
.op-body { border-top: 1px solid $border-soft; }

/* essentials block (always visible): image and command side by side, the
   ports under them */
.essentials { padding: 18px 18px 10px; }
.essentials.is-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 18px;
  // Top-aligned, so the image's "required" hint never pushes the command down.
  align-items: start;
  .field.wide { grid-column: 1 / -1; }
}
@media screen and (max-width: 768px) {
  .essentials.is-grid { grid-template-columns: minmax(0, 1fr); }
}

/* volume-op group header */
.group-h { display: flex; align-items: baseline; gap: 9px; margin-bottom: 12px;
  h3 { font-family: $title-family; font-size: 0.85rem; font-weight: 600; margin: 0; }
}

/* fields */
.field { display: grid; grid-template-columns: 150px minmax(0, 1fr); gap: 14px; align-items: start; padding: 8px 0;
  &.stack { grid-template-columns: 1fr; gap: 8px; }
}
.lab { padding-top: 8px;
  .name { display: inline; font-size: 0.85rem; font-weight: 600; color: $text; }
  .desc { display: block; color: $text-muted; font-size: 0.75rem; margin-top: 2px; line-height: 1.4; }
}
.field.stack .lab { padding-top: 0; }
.req { color: #0a9106; font-size: 0.6rem; font-weight: 700; font-family: $title-family; text-transform: uppercase; letter-spacing: 0.03em; }
code { font-family: monospace; font-size: 0.85em; color: #0a9e06; }

.control { min-width: 0; }
/* inputs: the site's field (the template search): a hairline, a green ring */
.jinput {
  width: 100%;
  min-height: 42px;
  border: 1px solid $border-soft;
  background: $white;
  border-radius: 10px;
  padding: 9px 13px;
  font-size: 0.875rem;
  color: $text;
  transition: border-color 0.15s, box-shadow 0.15s;
  &:hover { border-color: $border-strong; }
  &:focus { outline: 0; border-color: $secondary; box-shadow: 0 0 0 3px rgba($secondary, 0.15); }
  &.mono { font-family: $family-monospace; font-size: 0.82rem; }
  &::placeholder { color: $text-muted; }
}
.jselect {
  min-height: 42px;
  border: 1px solid $border-soft;
  background: $white;
  border-radius: 10px;
  padding: 9px 13px;
  font-size: 0.78rem;
  color: $text;
  cursor: pointer;
  &:focus { outline: 0; border-color: $secondary; box-shadow: 0 0 0 3px rgba($secondary, 0.15); }
  &.full { width: 100%; }
  option { background: $box-background-color; color: $text; }
}
.hint { display: inline-flex; align-items: center; gap: 5px; margin-top: 6px; font-size: 0.72rem; svg { width: 12px; height: 12px; }
  &.warn { color: #b8830a; }
}
.passthrough-note {
  margin: 0;
  padding: 8px 11px;
  border: 1px dashed $border;
  border-radius: 8px;
  color: $text-dark;
  font-size: 0.75rem;
  background: rgba($warning, 0.06);
}

/* rows */
.rows { display: flex; flex-direction: column; gap: 7px; }
/* breathing room before the "+ Add" affordance in collapsible sections */
.fold-body .rows { margin-bottom: 12px; }
.row { display: flex; align-items: center; gap: 7px; .jinput { flex: 1; } }
.env-key { flex: none; width: 190px; }
.eq { color: $text-muted; font-family: monospace; flex: none; }
.row-rm { width: 32px; height: 32px; flex: none; border: 1px solid transparent; background: transparent; color: $text-muted; border-radius: 8px; display: grid; place-items: center; cursor: pointer; transition: background 0.15s, color 0.15s; svg { width: 15px; height: 15px; }
  &:hover { background: rgba(#e5484d, 0.1); color: #e5484d; }
}

/* ports + health checks */
.port-list { display: flex; flex-direction: column; gap: 9px; margin-bottom: 9px; }
.port-card { border: 1px solid $border-soft; border-radius: 12px; background: $surface-sunken; padding: 12px 14px; }
.port-top { display: flex; align-items: center; gap: 8px; }
.port-input { display: flex; align-items: center; flex: none; min-height: 42px; border: 1px solid $border-soft; border-radius: 10px; background: $white; overflow: hidden; transition: border-color 0.15s, box-shadow 0.15s;
  .pfx { padding-left: 11px; color: $text-muted; font-family: monospace; font-size: 0.85rem; }
  input { border: 0; background: transparent; padding: 9px 12px 9px 3px; width: 84px; font-family: monospace; font-size: 0.82rem; color: $text; &:focus { outline: 0; } &::placeholder { color: $text-muted; } }
  &:focus-within { border-color: $secondary; box-shadow: 0 0 0 3px rgba($secondary, 0.15); }
}
.hc-line { margin-top: 10px; }
.hc-head { display: flex; align-items: center; justify-content: space-between; }
.hc-title { font-size: 0.74rem; font-weight: 600; color: $text-dark; }
.hc-fields { margin-top: 8px; display: flex; flex-direction: column; gap: 8px; padding-top: 8px; border-top: 1px dashed $border; }
.hc-field { display: flex; align-items: center; gap: 10px; }
.hc-label { font-size: 0.74rem; color: $text-dark; width: 96px; flex: none; }
.hc-keep { margin-left: auto; }
.hc-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 7px; }
@media screen and (max-width: 640px) { .hc-grid { grid-template-columns: 1fr; } }

.linkbtn { border: 0; background: transparent; padding: 0; cursor: pointer; font-family: $title-family; font-weight: 500; font-size: 0.74rem; color: #0a9e06;
  &:hover { text-decoration: underline; }
  &.danger { color: $text-muted; &:hover { color: #e5484d; } }
}

/* resources */
.res { display: flex; flex-direction: column; gap: 10px; border: 1px solid $border-soft; border-radius: 12px; padding: 12px 14px; background: $surface-sunken; }
.res-head { display: flex; align-items: center; justify-content: space-between; }
.res-type { flex: none; font-family: $title-family; font-weight: 600; font-size: 0.72rem; padding: 5px 9px; border-radius: 6px; background: rgba($secondary, 0.1); color: #0a9106; border: 1px solid rgba($secondary, 0.35); }
/* two-column grid so short inputs sit side by side instead of stacking */
.res-body { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 14px; align-items: start; }
.res-field { display: flex; flex-direction: column; gap: 4px; min-width: 0;
  > label { font-size: 0.72rem; color: $text-dark; display: flex; align-items: center; gap: 5px; }
  .jinput { padding: 7px 10px; }
  &.wide { grid-column: 1 / -1; }
}
.res-adv-toggle { grid-column: 1 / -1; justify-self: start; }
.res-adv { grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: 10px 14px; align-items: start; padding-top: 10px; border-top: 1px dashed $border; }
.res-subhead { grid-column: 1 / -1; font-family: $title-family; font-weight: 600; font-size: 0.68rem; color: $text-muted; text-transform: uppercase; letter-spacing: 0.04em; margin-top: 3px; }

/* collapsible sections */
.fold { border-top: 1px solid $border-soft; }
.fold-head { width: 100%; display: flex; align-items: center; gap: 10px; padding: 15px 18px; background: transparent; border: 0; color: $text; cursor: pointer; text-align: left; transition: background 0.15s;
  .chev { color: $text-muted; width: 15px; height: 15px; flex: none; transition: transform 0.18s; transform: rotate(-90deg); }
  .ft { font-family: $title-family; font-weight: 600; font-size: 0.9rem; }
  .fs { margin-left: auto; padding: 2px 9px; border-radius: 999px; background: $surface-sunken; color: $text-muted; font-size: 0.72rem; font-weight: 600; }
  &:hover { background: $surface-hover; }
}
.fold.open .chev { transform: rotate(0deg); }
.fold-body { padding: 2px 18px 18px; }

/* add buttons + menu */
/* add buttons: quiet pills that light green on hover */
.add-btn { display: inline-flex; align-items: center; gap: 7px; border: 1px solid $border-soft; background: transparent; color: $text; border-radius: 999px; padding: 7px 14px; font-family: inherit; font-weight: 600; font-size: 0.8rem; cursor: pointer; transition: all 0.15s; svg { width: 13px; height: 13px; color: $secondary-text; }
  &:hover { border-color: $secondary; background: rgba($secondary, 0.06); }
  &.big { font-size: 0.85rem; padding: 9px 16px; }
}
.jdb-addop { margin-top: 14px; }
/* In-flow (not absolute) so it can never be clipped by the modal's scroll overflow */
.add-menu { margin-top: 8px; background: $box-background-color; border: 1px solid $border; border-radius: 10px; box-shadow: 0 8px 20px -14px rgba(0, 0, 0, 0.25); padding: 6px; max-width: 340px;
  button { display: flex; flex-direction: column; gap: 1px; width: 100%; text-align: left; background: transparent; border: 0; border-radius: 7px; padding: 8px 10px; cursor: pointer;
    b { font-family: $title-family; font-size: 0.8rem; }
    small { color: $text-muted; font-size: 0.7rem; }
    &:hover { background: rgba(0, 0, 0, 0.04); }
  }
}

/* ---- dark mode ---- */
html.dark-mode {
  .jdb { color-scheme: dark; } /* render native select popups & spinners dark/readable */
  .op-body, .fold { border-color: rgba(255, 255, 255, 0.08); }
  .op-icon { color: $secondary; background: rgba($secondary, 0.1); border-color: rgba($secondary, 0.2); }
  .idfield label { color: #8a948a; }
  .lab .name, .fold-head { color: $white; }
  .lab .desc { color: #8a948a; }
  .fold-head .fs { background: rgba(255, 255, 255, 0.06); color: #b5b5b5; }
  .icon-btn:hover { background: rgba(255, 255, 255, 0.07); }
  .fold-head:hover { background: rgba(255, 255, 255, 0.03); }
  .jinput, .jselect { background: rgba(255, 255, 255, 0.04); border-color: rgba(255, 255, 255, 0.12); color: $white; &::placeholder { color: #6f7a6e; } &:hover { border-color: rgba(255, 255, 255, 0.22); } &:focus { border-color: $secondary; } }
  .jselect option { background: $box-background-color-dark; color: $white; }
  .port-input { background: rgba(255, 255, 255, 0.04); border-color: rgba(255, 255, 255, 0.12); input { color: $white; } }
  .res, .port-card { background: rgba(0, 0, 0, 0.2); border-color: rgba(255, 255, 255, 0.08); }
  .res-adv { border-top-color: #333; }
  .hc-fields { border-top-color: #333; }
  .add-btn { border-color: rgba(255, 255, 255, 0.14); color: $white; svg { color: $secondary; } &:hover { border-color: $secondary; } }
  .add-menu { background: $box-background-color-dark; border-color: #2c2c2c; button:hover { background: rgba(255, 255, 255, 0.05); } }
  .idfield .idinput { color: $white; &:hover { border-bottom-color: rgba(255, 255, 255, 0.2); } &:focus { border-bottom-color: $secondary; } }
  .req, .res-type { color: #3df23a; }
  code, .linkbtn { color: #3df23a; }
  .linkbtn.danger { color: $text-muted; }
}
</style>
