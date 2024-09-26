<template>
  <TopBar :title="'Job Builder'" :subtitle="'Create and deploy job definition files'"></TopBar>
  <form @submit.prevent="postJob">
    <div class="box">
      <div class="tabs">
        <ul>
          <li :class="{ 'is-active': tab === 'builder' }">
            <a :class="{ 'is-disabled': !validation.success }" @click="tab = 'builder'"
              class="is-justify-content-flex-start">BUILDER</a>
          </li>
          <li :class="{ 'is-active': tab === 'json' }">
            <a @click="tab = 'json'" class="is-justify-content-flex-start">RAW</a>
          </li>
        </ul>
      </div>
      <div v-if="tab === 'builder'">
        <div class="field">
          <label class="label">NOS Balance:</label>
          <span>
            <span v-if="loadingBalance">....... NOS</span>
            <CustomCountUp v-else-if="balance !== null" class="is-clickable" @click="refreshBalance" :end-val="balance"
              :decimal-places="2" :duration=".5">
              <template #suffix>
                <span> NOS</span>
              </template>
            </CustomCountUp>
            <div v-if="errorBalance" class="has-text-danger">
              <p>Error fetching balance: {{ errorBalance }}.
                <a class="has-text-danger" @click="refreshBalance"><u>retry</u></a>
              </p>
            </div>
          </span>
        </div>
        {{ jobDefinition }}
      </div>
      <div v-else-if="tab === 'json'">
        <div class="field">
          <div class="control is-loading" :class="{ 'is-loading': loading }">
            <textarea class="textarea" rows="10" placeholder="Insert Job Defintion JSON"
              v-model="rawJobDefinition"></textarea>
          </div>
        </div>
        <div v-for="validationError in validation.errors" class="notification is-danger is-light">
          <span v-if="validationError.path === '$input' && validationError.value === null">
            Could not parse Job Definition JSON
          </span>
          <span v-else>
            Error for property type <b>{{ validationError.path.replace('$input.', '') }}</b>:
            Expected type <b>{{ String(validationError.expected) }}</b><span v-if="validationError.value || true">, but
              found value
              <b>{{
                String(validationError.value) }}</b></span>
          </span>
        </div>
      </div>
    </div>
    <ClientOnly>
      <wallet-modal-provider v-if="!connected" :dark="$colorMode.value === 'dark'">
        <template #default="modalScope">
          <a class="button is-primary is-large" @click="modalScope.openModal()">
            Connect Wallet
          </a>
        </template>
      </wallet-modal-provider>
      <button v-else :disabled="!validation.success ? true : undefined" :class="{ 'is-loading': loading }"
        class="button is-primary is-large" type="submit">
        <span>Create Job</span>
      </button>
    </ClientOnly>
  </form>
</template>
<script lang="ts" setup>
import { sleep, validateJobDefinition, type IValidation, type JobDefinition } from "@nosana/sdk";
import { WalletModalProvider, useWallet } from "solana-wallets-vue";
import { useToast } from "vue-toastification";
const toast = useToast();
const tab: Ref<string> = ref('builder');
const loading: Ref<boolean> = ref(false);
const { connected, publicKey } = useWallet();
const { balance, refreshBalance, loadingBalance, errorBalance } = useStake(publicKey);
const rawJobDefinition: Ref<string> = ref(`{
  "version": "0.1",
  "type": "container",
  "ops": []
}
`);
const validation: ComputedRef<IValidation<JobDefinition>> = computed(() => {
  let json: any = null;
  try {
    json = JSON.parse(rawJobDefinition.value);
  } catch (e) {
    console.log('Could not parse json');
  }
  return validateJobDefinition(json);
});
const jobDefinition: ComputedRef<JobDefinition | null> = computed(() => {
  if (validation.value.success) {
    return validation.value.data;
  }
  return null;
});
const postJob = async () => {
  loading.value = true;
  await sleep(2);
  loading.value = false;
  toast.success('Succesfully created job');
}
</script>