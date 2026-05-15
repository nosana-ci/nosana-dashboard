import test from 'node:test';
import assert from 'node:assert/strict';

import { buildNosanaApiConfig } from '../app/utils/buildNosanaApiConfig.js';

test('uses apiBase for both dashboard and client-manager SDK endpoints', () => {
  const config = buildNosanaApiConfig({
    apiBase: 'http://localhost:3000',
    apiKey: null,
    includeCredentials: true,
  });

  assert.deepEqual(config, {
    backend_url: 'http://localhost:3000',
    client_manager_url: 'http://localhost:3000',
    include_credentials: true,
  });
});

test('returns undefined when no api settings are provided', () => {
  const config = buildNosanaApiConfig({
    apiBase: undefined,
    apiKey: null,
    includeCredentials: false,
  });

  assert.equal(config, undefined);
});