<template>
  <div>
    <div v-if="ipfsResult.opStates" class="is-family-monospace has-background-black has-text-white box light-mode">
      <div v-for="opState in ipfsResult.opStates" :key="opState.operationId">
        <div class="row-count has-text-link">
          <span>- Executed step '{{ opState.operationId }}'</span>
        </div>
        <div v-for="(log, ik) in opState.logs" :key="ik" class="row-count" :class="{
      'has-text-danger': log.type !== 'stdout',
    }">
          <span class="pre" v-html="log.log.slice(0, 10000)" />
        </div>
        <div class="row-count"></div>
        <div v-if="opState.status" class="row-count" :class="{
      'has-text-danger': opState.exitCode,
      'has-text-link': !opState.exitCode,
    }">
          {{ `Exited with status ${opState.status} with code ${opState.exitCode
      } ` }}
        </div>

      </div>
    </div>
    <div v-else-if="ipfsJob && ipfsJob.ops" class="is-family-monospace has-background-black has-text-white box"
      style="counter-reset: line">
      <div v-for="jobName in (ipfsJob.ops.find((j: any) => j.id === 'checkout')
      ? []
      : ['checkout']
    ).concat(ipfsJob.ops.map((j: any) => j.name || j.id))" :key="jobName">
        <template v-if="ipfsResult &&
      ipfsResult.results &&
      ipfsResult.results[jobName] &&
      !jobName.endsWith('-volume')
      ">
          <div class="row-count has-text-link">
            <span>- Executed step '{{ jobName }}'</span>
          </div>
          <div v-if="typeof ipfsResult.results[jobName][1] === 'string' &&
      (!ipfsResult.results[jobName][2] ||
        (Array.isArray(ipfsResult.results[jobName][2]) &&
          ipfsResult.results[jobName][2].length === 0))
      " class="has-text-danger row-count">
            <span>{{ ipfsResult.results[jobName][1] }}</span>
          </div>
          <div v-for="(step, index) in ipfsResult.results[jobName][2] &&
      Array.isArray(ipfsResult.results[jobName][2])
      ? ipfsResult.results[jobName][2][1]
      : ipfsResult.results[jobName][1]" v-else :key="index">
            <span v-if="typeof ipfsResult.results[jobName][1] === 'string' &&
      ipfsResult.results[jobName][2] &&
      index === 0
      " class="has-text-danger row-count">
              {{ ipfsResult.results[jobName][1] }}</span>
            <div v-if="step.cmd && false" class="row-count" :class="{
      'has-text-accent': !step.status,
      'has-text-danger': step.status,
    }">
              <span v-if="step.cmd.cmd" class="has-text-weight-bold">
                <span v-if="!step.cmd.cmd.startsWith('sh -c')">$ {{ step.cmd.cmd }}</span>
                <i v-else class="has-text-grey">executing through sh -c</i>
              </span>
              <span v-else class="has-text-weight-bold">$ {{ step.cmd }}</span>
            </div>
            <div v-if="step.log && Array.isArray(step.log)">
              <div v-for="(log, ik) in step.log" :key="ik" class="row-count" :class="{
      'has-text-danger': log[0] === 2 && step.status,
    }">
                <span class="pre" v-html="log[1].slice(0, 10000)" />
              </div>
              <div v-if="step.error" class="row-count has-text-danger">
                <span class="has-text-weight-bold">{{ step.error }}</span>
              </div>
              <div v-if="step.status" class="row-count has-text-danger">
                <span class="has-text-weight-bold">Exited with code {{ step.status }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>
      <template v-if="ipfsResult && ipfsResult.results && ipfsResult.results['nosana/error']
      ">
        <div class="row-count has-text-danger">
          {{ ipfsResult.results['nosana/error'] }}
        </div>
      </template>
    </div>
  </div>
</template>
<script lang="ts" setup>
defineProps({
  ipfsJob: {
    type: Object,
    required: true,
  },
  ipfsResult: {
    type: Object,
    required: true,
  },
});
</script>
<style lang="scss" scoped>
.pre {
  white-space: pre-wrap;
}

.row-count {
  word-break: break-word;
  max-width: 85%;
  padding-left: 40px;

  &:before {
    counter-increment: line;
    font-family: $family-monospace;
    font-weight: normal;
    content: counter(line);
    display: inline-block;
    padding: 0 0.5em;
    margin-right: 0.5em;
    color: $grey !important;
    min-width: 50px;
    text-align: right;
    margin-left: -62px;
  }

  &.has-text-danger:before {
    color: $red !important;
  }
}
</style>
