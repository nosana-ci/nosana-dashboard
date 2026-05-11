import test from 'node:test';
import assert from 'node:assert/strict';

import { mapNodeMetricsToSpecs } from '../app/utils/mapNodeMetricsToSpecs.js';

test('maps host-manager node metrics response into the legacy node specs shape', () => {
  const mapped = mapNodeMetricsToSpecs({
    nodeAddress: 'node-1',
    marketAddress: 'market-1',
    gpus: [
      {
        gpu: 'NVIDIA RTX 4090',
        vramMb: 24564,
        majorArchitecture: 8,
        minorArchitecture: 9,
      },
    ],
    metrics: {
      cpu_model: 'AMD EPYC',
      ram_mb: 131072,
      disk_space_gb: 2048,
      download_speed_mb: 950,
      upload_speed_mb: 810,
      ping_ms: 14,
      country: 'NL',
      cuda_driver: '12.4',
      nvml_driver: '550.54',
      node_version: '1.2.3',
      system_environment: 'linux',
    },
  });

  assert.deepEqual(mapped, {
    marketAddress: 'market-1',
    ram: 131072,
    diskSpace: 2048,
    cpu: 'AMD EPYC',
    country: 'NL',
    avgDownload10: 950,
    avgUpload10: 810,
    avgPing10: 14,
    gpus: [
      {
        gpu: 'NVIDIA RTX 4090',
        memory: 24564,
        architecture: '8.9',
      },
    ],
    cudaVersion: '12.4',
    nvmlVersion: '550.54',
    nodeVersion: '1.2.3',
    systemEnvironment: 'linux',
  });
});

test('supports nested and uppercase metric keys when top-level node info is sparse', () => {
  const mapped = mapNodeMetricsToSpecs({
    nodeAddress: 'node-2',
    marketAddress: null,
    metrics: {
      specs: {
        MEMORY_GB: 64,
        DISK_SPACE_GB: '512',
        PLATFORM_OS: 'wsl2',
        DEVICES: [
          {
            device_name: 'NVIDIA A100',
            vram_total_mb: 81920,
            major_architecture: 8,
            minor_architecture: 0,
          },
        ],
      },
      COUNTRY: 'US',
    },
  });

  assert.equal(mapped.ram, 65536);
  assert.equal(mapped.diskSpace, 512);
  assert.equal(mapped.country, 'US');
  assert.equal(mapped.systemEnvironment, 'wsl2');
  assert.deepEqual(mapped.gpus, [
    {
      gpu: 'NVIDIA A100',
      memory: 81920,
      architecture: '8.0',
    },
  ]);
});