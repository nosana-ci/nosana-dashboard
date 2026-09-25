// NOTE: TypeScript modules, so these tests need a TS-aware runner, e.g.
// `node --import tsx --test tests/cvmSshAccess.test.mjs`.
import test from 'node:test';
import assert from 'node:assert/strict';

import { applyCvmSshKeys, cvmJobApiUrl } from '../app/utils/cvmSshAccess';
import { pushSshKeysToCvmJobs } from '../app/utils/deploymentSshKeys';

const JOB = '6KEvFiLDE6ZxFGYiPBoybcRV9a3cm6GVHVgZGKNu8hdZ';
const NODE = 'AWM1sspTevTpx5r9CN8De7yCf5vuBgzAZwZwf6nrs6Wq';
const DOMAIN = 'node.k8s.prd.nos.ci';
const KEY_A = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGQ5uo6MFtVsk7r7cDzgnlzQnJiKRMYnnt4KjPg9j5Bv a@host';
const KEY_B = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIC8V4tYx7ub6XNOCa37RVyUIAmVwvbWv7sy5QqYwWfzw b@host';

function recordingFetch(status = 200, body = {}) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, method: init.method, headers: init.headers, body: JSON.parse(init.body) });
    return new Response(JSON.stringify(body), { status });
  };
  return { calls, fetchImpl };
}

test('cvmJobApiUrl addresses the job on its own domain', () => {
  assert.equal(cvmJobApiUrl(JOB, DOMAIN), `https://${JOB}.${DOMAIN}`);
});

test('applyCvmSshKeys revokes removed keys, then authorizes added ones, on the VM', async () => {
  const { calls, fetchImpl } = recordingFetch();
  await applyCvmSshKeys(
    { jobAddress: JOB, nodeDomain: DOMAIN, authorization: 'job:sig', added: [KEY_B], removed: [KEY_A] },
    fetchImpl,
  );
  assert.deepEqual(
    calls.map(({ url, method, body }) => [method, url, body.sshPublicKey]),
    [
      ['DELETE', `https://${JOB}.${DOMAIN}/ssh/keys`, KEY_A],
      ['POST', `https://${JOB}.${DOMAIN}/ssh/authorize`, KEY_B],
    ],
  );
  assert.equal(calls[0].headers.authorization, 'job:sig');
});

test('applyCvmSshKeys surfaces the VM error', async () => {
  const { fetchImpl } = recordingFetch(404, { error: 'Could not find active job' });
  await assert.rejects(
    applyCvmSshKeys(
      { jobAddress: JOB, nodeDomain: DOMAIN, authorization: 'job:sig', added: [KEY_A], removed: [] },
      fetchImpl,
    ),
    /Could not find active job/,
  );
});

test('pushSshKeysToCvmJobs applies the saved change to each job the node push failed on', async () => {
  const pushed = [];
  const result = await pushSshKeysToCvmJobs(
    {
      public_keys: [KEY_A, KEY_B],
      jobs: [
        { job: JOB, node: NODE, status: 'failed', error: '404 Not Found' },
        { job: 'OtherJob1111111111111111111111111111111111', node: NODE, status: 'authorized' },
      ],
    },
    [KEY_A],
    async (job, added, removed) => {
      pushed.push({ job, added, removed });
    },
  );
  assert.deepEqual(pushed, [{ job: JOB, added: [KEY_B], removed: [] }]);
  assert.deepEqual(result.jobs[0], { job: JOB, node: NODE, status: 'authorized' });
  assert.equal(result.jobs[1].status, 'authorized');
});

test('pushSshKeysToCvmJobs keeps a job failed, with the VM error, when the VM refuses', async () => {
  const result = await pushSshKeysToCvmJobs(
    { public_keys: [], jobs: [{ job: JOB, node: NODE, status: 'failed', error: '404 Not Found' }] },
    [KEY_A],
    async () => {
      throw new Error('Unauthorized Request');
    },
  );
  assert.deepEqual(result.jobs[0], { job: JOB, node: NODE, status: 'failed', error: 'Unauthorized Request' });
});

test('pushSshKeysToCvmJobs does nothing when no key changed', async () => {
  let called = false;
  const input = { public_keys: [KEY_A], jobs: [{ job: JOB, node: NODE, status: 'failed' }] };
  const result = await pushSshKeysToCvmJobs(input, [KEY_A], async () => {
    called = true;
  });
  assert.equal(called, false);
  assert.equal(result, input);
});
