<template>
  <div>
    <TopBar :title="'Leaderboards'" :subtitle="'Performance Benchmarks'" />
    <div class="box">
      <div class="tabs">
        <ul>
          <li :class="{ 'is-active': activeTab === 'llm' }">
            <a @click="activeTab = 'llm'">LLM Benchmarks</a>
          </li>
          <li :class="{ 'is-active': activeTab === 'image' }">
            <a @click="activeTab = 'image'">Image Generation</a>
          </li>
        </ul>
      </div>

      <div v-if="activeTab === 'llm'">
        <LeaderboardLLM />
      </div>
      <div v-else-if="activeTab === 'image'">
        <LeaderboardImageGen />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import LeaderboardLLM from '~/components/Leaderboard/LLM.vue';
import LeaderboardImageGen from '~/components/Leaderboard/ImageGen.vue';

const activeTab = ref('llm');
</script>
