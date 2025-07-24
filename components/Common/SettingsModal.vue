<template>
  <transition name="modal-fade">
    <div v-if="modelValue" class="settings-modal-overlay" :class="[isDark ? 'dark' : 'light']" @click.self="closeModal">
      <transition name="modal-scale">
        <div class="settings-modal-card">
          <button class="close-btn" @click="closeModal" aria-label="Close">
            <svg width="28" height="28" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 6L14 14M14 6L6 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
          <h2 class="modal-title">Settings</h2>
          <h3 class="modal-subtitle">Global Priority Fee Level</h3>
          <p class="modal-desc">
            These fees apply across Nosana's entire product suite, such as staking actions, posting jobs etc.
          </p>
          <div class="fee-options">
            <button
              v-for="option in options"
              :key="option.value"
              class="fee-btn"
              :class="{ selected: prioFee.strategy === option.value }"
              @click="setPrioFeeConfig(option.value)"
            >
              <span>{{ option.label }}</span>
            </button>
          </div>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
const props = defineProps({
  modelValue: { type: Boolean, required: true },
  prioFee: { type: Object, required: true },
  setPrioFeeConfig: { type: Function, required: true },
});
const emit = defineEmits(['update:modelValue']);

const closeModal = () => {
  emit('update:modelValue', false);
};

const options = [
  { value: 'low', label: 'Slow' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'Fast' },
  { value: 'veryHigh', label: 'Ultra' },
];

const isDark = ref(document.documentElement.classList.contains('dark-mode'));

function updateIsDark() {
  isDark.value = document.documentElement.classList.contains('dark-mode');
}

onMounted(() => {
  const observer = new MutationObserver(updateIsDark);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('color-mode-change', updateIsDark);
  updateIsDark();
  onUnmounted(() => {
    observer.disconnect();
    window.removeEventListener('color-mode-change', updateIsDark);
  });
});
</script>

<style scoped lang="scss">
.settings-modal-overlay {
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.45);
  transition: background 0.3s;
  pointer-events: auto;
}
.settings-modal-overlay.light {
  --modal-bg: #fff;
  --modal-text: #1a1a1a;
  --selector-bg: #10e80c;
  --selector-text: #1a1a1a;
  --selector-hover: #f5f5f5;
}
.settings-modal-overlay.dark {
  --modal-bg: #181818;
  --modal-text: #fff;
  --selector-bg: #10e80c;
  --selector-text: #fff;
  --selector-hover: #232323;
}
.settings-modal-card {
  background: var(--modal-bg);
  color: var(--modal-text);
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
  padding: 2.5rem 2rem 2rem 2rem;
  min-width: 340px;
  max-width: 95vw;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  animation: modal-pop 0.25s cubic-bezier(.4,2,.6,1) 1;
  pointer-events: auto;
}
@keyframes modal-pop {
  0% { transform: scale(0.95) translateY(30px); opacity: 0; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}
.close-btn {
  position: absolute;
  top: 1.1rem;
  right: 1.1rem;
  background: none;
  border: none;
  padding: 0.2rem;
  border-radius: 50%;
  color: var(--modal-text);
  cursor: pointer;
  opacity: 0.7;
  transition: background 0.2s, opacity 0.2s, color 0.2s;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}
.close-btn:hover, .close-btn:focus {
  background: rgba(0,0,0,0.07);
  opacity: 1;
  color: #10e80c;
}
.close-btn svg {
  display: block;
}
.modal-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  letter-spacing: -1px;
}
.modal-subtitle {
  font-size: 1.15rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}
.modal-desc {
  font-size: 1rem;
  margin-bottom: 1.5rem;
  color: var(--modal-text);
  opacity: 0.85;
}
.fee-options {
  display: flex;
  gap: 1rem;
  width: 100%;
  margin-top: 0.5rem;
}
.fee-btn {
  flex: 1 1 0;
  background: transparent;
  border: none;
  color: var(--modal-text);
  font-weight: 600;
  font-size: 1.1rem;
  border-radius: 10px;
  padding: 0.7em 0.5em;
  transition: background 0.18s, color 0.18s;
  cursor: pointer;
  outline: none;
  box-shadow: none;
  position: relative;
}
.fee-btn.selected {
  background: var(--selector-bg);
  color: var(--selector-text);
}
.fee-btn:not(.selected):hover {
  background: var(--selector-hover);
}
/* Animations */
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.25s cubic-bezier(.4,2,.6,1);
}
.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-to, .modal-fade-leave-from {
  opacity: 1;
}
.modal-scale-enter-active, .modal-scale-leave-active {
  transition: transform 0.28s cubic-bezier(.4,2,.6,1), opacity 0.28s cubic-bezier(.4,2,.6,1);
}
.modal-scale-enter-from, .modal-scale-leave-to {
  transform: scale(0.92) translateY(30px);
  opacity: 0;
}
.modal-scale-enter-to, .modal-scale-leave-from {
  transform: scale(1) translateY(0);
  opacity: 1;
}
@media (max-width: 500px) {
  .settings-modal-card {
    min-width: 90vw;
    padding: 1.2rem 0.7rem 1.2rem 0.7rem;
  }
  .modal-title {
    font-size: 1.3rem;
  }
  .fee-options {
    gap: 0.5rem;
  }
}
</style> 