<template>
  <div class="mb-4">
    <h2 class="title is-5 mb-3">Deployment Revisions</h2>
    <div v-if="revisions && revisions.length > 0" class="box is-borderless">
      <div class="table-container">
        <table class="table is-fullwidth">
          <thead>
            <tr>
              <th>Revision</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="revision in revisions" :key="revision.revision">
              <td>
                <span class="has-text-weight-semibold">{{
                  revision.revision
                }}</span>
              </td>
              <td>
                <StatusTag
                  :status="
                    revision.revision === activeRevision
                      ? 'COMPLETED'
                      : 'INACTIVE'
                  "
                  :customLabel="
                    revision.revision === activeRevision ? 'ACTIVE' : undefined
                  "
                  :showLabel="true"
                  :imageOnly="false"
                />
              </td>
              <td class="has-text-grey">
                {{ formatDate(revision.created_at) }}
              </td>
              <td>
                <div class="buttons are-small">
                  <button
                    v-if="revision.revision !== activeRevision"
                    @click="$emit('switchToRevision', revision.revision)"
                    class="button is-primary is-small"
                    :class="{
                      'is-loading': switchingRevision === revision.revision,
                    }"
                    :disabled="actionLoading || switchingRevision !== null"
                  >
                    Make Active
                  </button>
                  <button
                    @click="$emit('viewRevision', revision)"
                    class="button is-light is-small"
                  >
                    View Configuration
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div v-else class="notification is-light has-text-centered">
      <p>No revisions found for this deployment.</p>
      <p class="has-text-grey is-size-7 mt-2">
        Create a new revision using the Actions menu.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DeploymentRevisionItem } from "@nosana/api";
import { formatDate } from "~/utils/formatDate";
import StatusTag from "~/components/Common/StatusTag.vue";

defineProps<{
  revisions: DeploymentRevisionItem[];
  activeRevision: number | undefined;
  switchingRevision: number | null;
  actionLoading: boolean;
}>();

defineEmits<{
  switchToRevision: [revisionNumber: number];
  viewRevision: [revision: DeploymentRevisionItem];
}>();
</script>
