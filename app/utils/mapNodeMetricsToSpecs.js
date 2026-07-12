function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function toNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function toStringValue(value) {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

function findMetricValue(container, keys) {
  if (!isObject(container)) return undefined;

  for (const [entryKey, entryValue] of Object.entries(container)) {
    if (keys.includes(entryKey)) {
      return entryValue;
    }
  }

  for (const value of Object.values(container)) {
    if (isObject(value)) {
      const nested = findMetricValue(value, keys);
      if (nested !== undefined) return nested;
    }
  }

  return undefined;
}

function mapGpuDevices(response) {
  if (Array.isArray(response?.gpus) && response.gpus.length > 0) {
    return response.gpus.map((gpu) => ({
      gpu: gpu.gpu,
      memory: toNumber(gpu.vramMb),
      architecture:
        typeof gpu.majorArchitecture === 'number' && typeof gpu.minorArchitecture === 'number'
          ? `${gpu.majorArchitecture}.${gpu.minorArchitecture}`
          : undefined,
    }));
  }

  const metrics = response?.metrics;
  const devices = findMetricValue(metrics, ['devices', 'DEVICES']);
  if (!Array.isArray(devices)) return undefined;

  return devices.map((gpu) => {
    const major = toNumber(gpu.major_architecture ?? gpu.majorArchitecture);
    const minor = toNumber(gpu.minor_architecture ?? gpu.minorArchitecture);

    return {
      gpu: gpu.device_name ?? gpu.gpu_name ?? gpu.name ?? gpu.gpu,
      memory: toNumber(gpu.vram_total_mb ?? gpu.vramMb ?? gpu.memory_mb),
      architecture:
        major !== undefined && minor !== undefined ? `${major}.${minor}` : undefined,
    };
  });
}

export function mapNodeMetricsToSpecs(response) {
  if (!response || typeof response !== 'object') return null;

  const metrics = isObject(response.metrics) ? response.metrics : {};

  const memoryMb =
    toNumber(findMetricValue(metrics, ['ram_mb', 'RAM_MB', 'memory_mb', 'MEMORY_MB'])) ??
    ((toNumber(findMetricValue(metrics, ['memory_gb', 'MEMORY_GB', 'ram_gb', 'RAM_GB'])) ?? 0) * 1024);

  return {
    marketAddress: response.marketAddress,
    ram: memoryMb || undefined,
    diskSpace: toNumber(
      findMetricValue(metrics, ['disk_space_gb', 'DISK_SPACE_GB', 'disk_gb', 'DISK_GB'])
    ),
    cpu: toStringValue(findMetricValue(metrics, ['cpu_model', 'CPU_MODEL', 'cpu', 'CPU'])),
    country: toStringValue(findMetricValue(metrics, ['country', 'COUNTRY'])),
    avgDownload10: toNumber(
      findMetricValue(metrics, [
        'download_mbps',
        'DOWNLOAD_MBPS',
        'download_speed_mb',
        'DOWNLOAD_SPEED_MB',
        'avgDownload10',
      ])
    ),
    avgUpload10: toNumber(
      findMetricValue(metrics, [
        'upload_mbps',
        'UPLOAD_MBPS',
        'upload_speed_mb',
        'UPLOAD_SPEED_MB',
        'avgUpload10',
      ])
    ),
    avgPing10: toNumber(
      findMetricValue(metrics, ['ping_ms', 'PING_MS', 'latency_ms', 'LATENCY_MS', 'avgPing10'])
    ),
    gpus: mapGpuDevices(response),
    cudaVersion: toStringValue(
      findMetricValue(metrics, [
        'cuda_driver_version',
        'CUDA_DRIVER_VERSION',
        'cuda_driver',
        'CUDA_DRIVER',
        'cuda_version',
        'CUDA_VERSION',
        'runtime_version',
        'RUNTIME_VERSION',
      ])
    ),
    nvmlVersion: toStringValue(
      findMetricValue(metrics, [
        'nvml_driver_version',
        'NVML_DRIVER_VERSION',
        'nvml_driver',
        'NVML_DRIVER',
        'nvml_version',
        'NVML_VERSION',
      ])
    ),
    nodeVersion: toStringValue(
      findMetricValue(metrics, ['node_version', 'NODE_VERSION', 'runtime_version', 'version'])
    ),
    systemEnvironment: toStringValue(
      findMetricValue(metrics, ['system_environment', 'SYSTEM_ENVIRONMENT', 'platform_os', 'PLATFORM_OS'])
    ),
  };
}