<template>
  <template v-if="props.specs || (props.genericBenchmarkResponse && props.genericBenchmarkResponse.data?.length)">
    <!-- GPU -->
    <div class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
      <div class="quick-detail-item">
        <span class="quick-detail-label">GPU</span>
        <span class="quick-detail-value">
          <span v-if="props.specs?.gpus?.length">{{ props.specs.gpus[0].gpu }}</span>
          <span v-else>-</span>
        </span>
      </div>
    </div>

    <!-- NVIDIA Driver -->
    <div class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
      <div class="quick-detail-item">
        <span class="quick-detail-label">NVIDIA Driver</span>
        <span class="quick-detail-value">
          <span>{{ props.specs?.nvmlVersion || "-" }}</span>
        </span>
      </div>
    </div>

    <!-- CUDA Version -->
    <div class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
      <div class="quick-detail-item">
        <span class="quick-detail-label">CUDA Version</span>
        <span class="quick-detail-value">
          <span>{{ props.specs?.cudaVersion || "-" }}</span>
        </span>
      </div>
    </div>

    <!-- CPU - hide in job context since it's already shown in Quick Details -->
    <div v-if="!props.showInJobContext" class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
      <div class="quick-detail-item">
        <span class="quick-detail-label">CPU</span>
        <span class="quick-detail-value">
          <span>{{ props.specs?.cpu || "-" }}</span>
        </span>
      </div>
    </div>

    <!-- RAM - hide in job context since it's already shown in Quick Details -->
    <div v-if="!props.showInJobContext" class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
      <div class="quick-detail-item">
        <span class="quick-detail-label">RAM</span>
        <span class="quick-detail-value">
          <span>{{ props.specs?.ram }} MB</span>
        </span>
      </div>
    </div>

    <!-- Disk Space - hide in job context since it's already shown in Quick Details -->
    <div v-if="!props.showInJobContext" class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
      <div class="quick-detail-item">
        <span class="quick-detail-label">Disk Space</span>
        <span class="quick-detail-value">
          <span>{{ props.specs?.diskSpace }} GB</span>
        </span>
      </div>
    </div>

    <!-- Country - hide in job context since it's already shown in Quick Details -->
    <div v-if="!props.showInJobContext" class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
      <div class="quick-detail-item">
        <span class="quick-detail-label">Country</span>
        <span class="quick-detail-value">
          <span>{{ formatCountry(props.specs?.country) }}</span>
        </span>
      </div>
    </div>

    <!-- System Environment -->
    <div class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
      <div class="quick-detail-item">
        <span class="quick-detail-label">System Environment</span>
        <span class="quick-detail-value">
          <span>{{ props.specs?.systemEnvironment || "-" }}</span>
        </span>
      </div>
    </div>

    <!-- Download Speed - hide in job context since it's already shown in Quick Details -->
    <div v-if="!props.showInJobContext" class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
      <div class="quick-detail-item">
        <span class="quick-detail-label">Download Speed</span>
        <span class="quick-detail-value">
          <span v-if="!props.aggregatedDownloadSpeed">-</span>
          <span v-else>{{ props.aggregatedDownloadSpeed }} Mbps</span>
        </span>
      </div>
    </div>

    <!-- Upload Speed -->
    <div class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
      <div class="quick-detail-item">
        <span class="quick-detail-label">Upload Speed</span>
        <span class="quick-detail-value">
          <span v-if="!props.aggregatedUploadSpeed">-</span>
          <span v-else>{{ props.aggregatedUploadSpeed }} Mbps</span>
        </span>
      </div>
    </div>
  </template>
  <template v-else>
    <div class="column is-full">
      <p>System specifications are not available for this account.</p>
    </div>
  </template>
</template>

<script setup lang="ts">
interface Specs {
  gpus: Array<{ gpu: string }>;
  cpu: string;
  ram: number;
  diskSpace: number;
  country: string;
  bandwidth?: {
    ping: number;
    download: number;
    upload: number;
  };
  cudaVersion: number | string; // Allow string for flexibility if API sends it as such
  nvmlVersion: string;
  nodeVersion: string;
  systemEnvironment: string | null;
}

interface NodeRanking {
  node: string;
  participationRate: number;
  uptimePercentage: number;
}

const props = defineProps<{
  specs?: Specs | null; // Allow null explicitly for the specs prop
  nodeRanking?: NodeRanking | null;
  genericBenchmarkResponse?: any;
  aggregatedDownloadSpeed: string | null;
  aggregatedUploadSpeed: string | null;
  showInJobContext?: boolean;
}>();

const formatCountry = (countryCode?: string) => {
  if (!countryCode) return "-";
  try {
    return (
      new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode) ||
      countryCode
    );
  } catch {
    return countryCode;
  }
};
</script>

<style lang="scss" scoped>
.quick-detail-item {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  height: 100%;

  .quick-detail-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: #7a7a7a;
    text-transform: uppercase;
    margin-bottom: 0.1rem;
  }

  .quick-detail-value {
    font-size: 0.85rem;
    font-weight: 500;
    color: #363636;
    word-break: break-word;
  }
}

.no-padding {
  padding: 0 !important;
}

html.dark-mode {
  .quick-detail-item {
    .quick-detail-label {
      color: #b0b0b0;
    }
    .quick-detail-value {
      color: #ffffff;
    }
  }
}
</style>
