<template>
  <div class="mb-4">
    <h2 class="title is-5 mb-3">Deployment Revisions</h2>
    <div v-if="revisions && revisions.length > 0" class="rev-card">
      <div
        v-for="revision in revisions"
        :key="revision.revision"
        class="revrow"
        :class="{ 'is-active': revision.revision === activeRevision }"
      >
        <span class="rnum">{{ revision.revision }}</span>
        <div class="rmain">
          <div class="rtitle">
            Revision {{ revision.revision }}
            <span
              v-if="revision.revision === activeRevision"
              class="active-chip"
            >
              <span class="active-dot"></span>Active
            </span>
          </div>
          <div class="rdate">{{ formatTimeAgo(revision.created_at) }}</div>
        </div>
        <div class="racts">
          <button
            v-if="revision.revision !== activeRevision"
            @click="$emit('switchToRevision', revision.revision)"
            class="button is-small make-active-btn"
            :class="{
              'is-loading': switchingRevision === revision.revision,
            }"
            :disabled="actionLoading || switchingRevision !== null"
          >
            Make Active
          </button>
          <button
            @click="$emit('viewRevision', revision)"
            class="button is-small view-btn"
          >
            {{ revision.revision === activeRevision ? "View Configuration" : "View" }}
          </button>
        </div>
      </div>
    </div>
    <div v-else class="rev-card rev-empty">
      <p class="has-text-weight-medium">No revisions found for this deployment.</p>
      <p class="has-text-grey is-size-7 mt-2">
        Create a new revision using the Actions menu.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DeploymentRevisionItem } from "@nosana/api";
import { formatTimeAgo } from "~/utils/relativeTime";

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

<style lang="scss" scoped>
@use "sass:color";

.rev-card {
  background: $white;
  border: 1px solid $grey-lighter;
  border-radius: 14px;
  overflow: hidden;
}

.revrow {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 18px;
  position: relative;
  transition: background 0.12s ease;

  & + &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 18px;
    right: 18px;
    height: 1px;
    background: $grey-lighter;
  }

  &:hover {
    background: $white-ter;
  }
}

.rnum {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: $white-ter;
  color: $grey;
  font-family: monospace;
  font-weight: 600;
  font-size: 13px;
  display: grid;
  place-items: center;
  flex: none;
}

.revrow.is-active .rnum {
  background: $secondary;
  color: $black;
}

.rmain {
  flex: 1;
  min-width: 0;
}

.rtitle {
  font-family: $title-family;
  font-weight: 600;
  font-size: 14px;
  color: $text;
  display: flex;
  align-items: center;
  gap: 9px;
}

.rdate {
  font-size: 12.5px;
  color: $grey;
  margin-top: 2px;
  font-variant-numeric: tabular-nums;
}

.active-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: $title-family;
  font-weight: 600;
  font-size: 11px;
  padding: 2px 9px;
  border-radius: 999px;
  background: rgba($secondary, 0.14);
  color: color.adjust($secondary, $lightness: -18%);
}

.active-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: $secondary;
}

.racts {
  display: inline-flex;
  gap: 6px;
  flex: none;
}

.make-active-btn,
.view-btn {
  border: 1px solid $grey-lighter;
  border-radius: 8px;
  background: $white;
  color: $text;
  font-weight: 500;
  font-size: 0.8rem;
  box-shadow: none;

  &:hover {
    border-color: $grey-light;
    background: $white-ter;
  }
}

.rev-empty {
  text-align: center;
  padding: 2.5rem 1.5rem;
  color: $text;
}

html.dark-mode {
  .rev-card {
    background: $black-ter;
    border-color: rgba($white, 0.08);
  }

  .revrow + .revrow::before {
    background: rgba($white, 0.08);
  }

  .revrow:hover {
    background: rgba($white, 0.04);
  }

  .rnum {
    background: rgba($white, 0.07);
    color: $grey-light;
  }

  .revrow.is-active .rnum {
    background: $secondary;
    color: $black;
  }

  .rtitle {
    color: $white;
  }

  .rdate {
    color: $grey-light;
  }

  .active-chip {
    background: rgba($secondary, 0.18);
    color: $secondary;
  }

  .rev-empty {
    color: $white;
  }

  .make-active-btn,
  .view-btn {
    background: rgba($white, 0.05);
    border-color: rgba($white, 0.12);
    color: $white;

    &:hover {
      background: rgba($white, 0.1);
    }
  }
}
</style>
