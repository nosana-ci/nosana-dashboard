<template>
  <TopBar :title="'Job Builder'" :subtitle="'Create and deploy job definition files'"></TopBar>
  <form @submit.prevent="postJob">
    <div class="box">
      <div class="tabs">
        <ul>
          <li :class="{ 'is-active': tab === 'builder' }">
            <a :class="{ 'is-disabled': !jobDefinition }" @click="tab = 'builder'"
              class="is-justify-content-flex-start">BUILDER</a>
          </li>
          <li :class="{ 'is-active': tab === 'json' }">
            <a @click="tab = 'json'" class="is-justify-content-flex-start">JSON</a>
          </li>
        </ul>
      </div>
      <div v-if="tab === 'builder'">
        <div v-for="(op, i) in jobDefinition.ops" class="notification has-background-white-ter">
          <a v-if="jobDefinition.ops.length > 1" class="is-pulled-right"
            @click="jobDefinition.ops.splice(i, 1)">remove</a>
          <div class="field" v-if="op">
            <label class="label">Operation Identifier</label>
            <div class="control">
              <input class="input" v-model="op.id" type="text" placeholder="id">
            </div>
          </div>

          <div class="field">
            <label class="label">Type</label>
            <div class="control">
              <div class="select">
                <select v-model="op.type">
                  <option value="container/run">Docker command</option>
                  <option disabled value="container/create-volume">Create volume</option>
                </select>
              </div>
            </div>
          </div>
          <div v-if="op.type === 'container/run'">
            <div class="field">
              <label class="label">Docker Image</label>
              <div class="control has-icons-left has-icons-right">
                <input class="input" v-model="(op.args as OperationArgsMap['container/run']).image" type="text"
                  placeholder="image">
                <span class="icon is-small is-left">
                  <img src="/img/icons/type/docker.svg" width="20px" />
                </span>
                <span class="icon is-small is-right" style="pointer-events: all;">
                  <a :href="`https://hub.docker.com/search?q=${(op.args as OperationArgsMap['container/run']).image}&type=image`"
                    target="_blank">
                    <img src="~assets/img/icons/external.png" width="15px" />
                  </a>
                </span>
              </div>
            </div>
            <div class="field">
              <label class="label">Command
                <a class="is-pulled-right is-size-7 mt-2"
                  href="https://www.docker.com/blog/docker-best-practices-choosing-between-run-cmd-and-entrypoint/"
                  target="_blank">Learn more about docker CMD</a>
              </label>
              <div class="control">
                <div
                  v-if="typeof (op.args as OperationArgsMap['container/run']).cmd === 'string' || !(op.args as OperationArgsMap['container/run']).cmd">
                  <input class="input" v-model="(op.args as OperationArgsMap['container/run']).cmd" type="text"
                    placeholder="cmd">
                  <p class="is-size-7">
                    <b>Shell</b> form<span class="ml-2"><a
                        @click="(op.args as OperationArgsMap['container/run']).cmd = ((op.args as OperationArgsMap['container/run']).cmd! as string).split(' ')">Switch
                        to exec form</a></span>
                  </p>
                </div>
                <div v-else-if="Array.isArray((op.args as OperationArgsMap['container/run']).cmd)">
                  <div v-for="(cmd, i) in (op.args as OperationArgsMap['container/run']).cmd">
                    <div class="field has-addons">
                      <p class="control is-expanded">
                        <input class="input" v-model="(op.args as OperationArgsMap['container/run']).cmd![i]"
                          type="text" placeholder="cmd">
                      </p>
                      <p class="control">
                        <a class="button"
                          @click="((op.args as OperationArgsMap['container/run']).cmd! as string[]).splice(i, 1)">
                          delete
                        </a>
                      </p>
                    </div>
                  </div>
                  <a class="button" @click="((op.args as OperationArgsMap['container/run']).cmd! as string[]).push('')">
                    add cmd
                  </a>
                  <p class="is-size-7">
                    <b>Exec</b> form<span class="ml-2"><a
                        @click="(op.args as OperationArgsMap['container/run']).cmd = ((op.args as OperationArgsMap['container/run']).cmd! as string[]).join(' ')">Switch
                        to shell form</a></span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="field is-grouped is-grouped-right">
          <p class="control">
            <a class="button is-primary is-outlined" @click="openFile()">
              <span>Import</span>
            </a>
          </p>
          <p class="control">
            <a class="button is-primary is-outlined" @click="saveToFile()">
              <span>Export</span>
            </a>
          </p>
          <p class="control">
            <a class="button is-primary" @click="jobDefinition.ops.push({
              id: 'operation-' + (jobDefinition.ops.length + 1), type: 'container/run', args: { image: 'ubuntu' }
            })">
              <span class="icon">+</span>
              <span>Add Operation</span>
            </a>
          </p>
        </div>
      </div>
      <div v-else-if="tab === 'json'">
        <div class="field">
          <div class="control" :class="{ 'is-loading': loading }">
            <JsonEditorVue :onRenderMenu="onRenderMenu" :validator="validator"
              :class="{ 'jse-theme-dark': $colorMode.value === 'dark' }" v-model="jobDefinition" :mode="Mode.text"
              :mainMenuBar="true" :stringified="false" />
          </div>
        </div>
      </div>
    </div>
    <div class="field">
      <label class="label" v-if="balance !== null || loadingBalance">NOS Balance:</label>
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
            <a class="button is-small is-danger" @click.prevent="refreshBalance()"><u>retry</u></a>
          </p>
        </div>
      </span>
    </div>
    <ClientOnly>
      <wallet-modal-provider v-if="!connected" :dark="$colorMode.value === 'dark'">
        <template #default="modalScope">
          <a class="button is-primary is-large" @click="modalScope.openModal()">
            Connect Wallet
          </a>
        </template>
      </wallet-modal-provider>
      <button v-else :disabled="!jobDefinition ? true : undefined" :class="{ 'is-loading': loading }"
        class="button is-primary is-large" type="submit">
        <span>Create Job</span>
      </button>
    </ClientOnly>
  </form>
</template>
<script lang="ts" setup>
import JsonEditorVue from 'json-editor-vue';
import 'vanilla-jsoneditor/themes/jse-theme-dark.css'
import { faSave } from '@fortawesome/free-regular-svg-icons';
import { faUpload } from '@fortawesome/free-solid-svg-icons';
import { Mode, type MenuItem, parseJSONPath, ValidationSeverity, type ValidationError } from 'vanilla-jsoneditor'
import { sleep, validateJobDefinition, type IValidation, type JobDefinition, type OperationArgsMap } from "@nosana/sdk";
import { WalletModalProvider, useWallet } from "solana-wallets-vue";
import { useToast } from "vue-toastification";
import { initialJobDefinition } from '~/utils/job-definitions';
const toast = useToast();
const tab: Ref<string> = ref('builder');
const loading: Ref<boolean> = ref(false);
const { connected, publicKey } = useWallet();
const { balance, refreshBalance, loadingBalance, errorBalance } = useStake(publicKey);
const jobDefinition: Ref<JobDefinition> = useLocalStorage('job-definition', initialJobDefinition)
watch(() => jobDefinition.value, async (newValue: any) => {
  if (newValue === "") {
    await nextTick();
    jobDefinition.value = initialJobDefinition;
  }
});

const { open: openFile, reset: resetFile, onChange: onFileUpload } = useFileDialog({
  accept: 'application/json', // Set to accept only json files
  multiple: false
})

onFileUpload(async (files) => {
  if (files && files[0]) {
    const content = await files[0].text();
    try {
      jobDefinition.value = JSON.parse(content);
      resetFile();
    } catch (e) {
      toast.error("Could not parse file as JSON");
    }
  }
})

const JSONToFile = (obj: any, filename: string) => {
  const blob = new Blob([JSON.stringify(obj, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const saveToFile = () => {
  if (!jobDefinition.value) {
    toast.error('Fix errors first before saving to file');
  } else {
    const filename = jobDefinition.value.ops && jobDefinition.value.ops[0] && jobDefinition.value.ops[0].id.length ? jobDefinition.value.ops[0].id + '.json' : 'job-definition.json';
    JSONToFile(jobDefinition.value, filename);
    toast.success(`Saved to ${filename}`);
  }
}

const onRenderMenu = (items: MenuItem[]): MenuItem[] | undefined => {
  const save: MenuItem = {
    type: 'button',
    icon: faSave,
    title: 'Save to File',
    onClick: () => saveToFile()
  }
  const importFile: MenuItem = {
    type: 'button',
    icon: faUpload,
    title: 'Import File',
    onClick: () => openFile()
  }
  const seperator = items.find(i => i.type === "separator")!;
  return [
    items.find(i => i.type === "button" && i.className === 'jse-format')!,
    items.find(i => i.type === "button" && i.className === 'jse-compact')!,
    items.find(i => i.type === "button" && i.className === 'jse-search')!,
    seperator,
    items.find(i => i.type === "button" && i.className === 'jse-undo')!,
    items.find(i => i.type === "button" && i.className === 'jse-redo')!,
    seperator,
    importFile,
    save
  ];
}
const validator = (json: any): Array<ValidationError> => {
  const validation: IValidation<JobDefinition> = validateJobDefinition(json);
  const errors: Array<ValidationError> = []
  validation.errors?.forEach((validationError) => {
    const path = parseJSONPath(validationError.path.replace('$input.', '').replace('$input', ''));
    for (let i = 0; i < path.length; i++) {
      const match = (path[i] as string).match(/(.*?)\[(\d+)\]/);
      if (match) {
        path[i] = match[1];
        // @ts-ignore-error
        path.splice(i + 1, 0, parseInt(match[2]));
        i++;
      }
    }
    let property: string | undefined;
    if (!validationError.value) {
      property = path.pop();
    }
    errors.push({
      path,
      message: `${validationError.value && (validationError.expected && validationError.expected !== 'undefined')
        ? `Expected value of type ${String(validationError.expected)}, but found value ${JSON.stringify(validationError.value)}`
        : property
          ? `property '${property}' is required`
          : validationError.expected && validationError.expected !== 'undefined'
            ? `Expected value of type ${String(validationError.expected)}`
            : `Unknown property ${path.slice(-1)}`
        }`,
      severity: ValidationSeverity.error
    })
  })
  if (json.ops && Array.isArray(json.ops) && json.ops.length === 0) {
    errors.push({
      path: ['ops'],
      message: `Make sure to add at least one Operation in ops`,
      severity: ValidationSeverity.error
    })
  }

  return errors;
}


const postJob = async () => {
  loading.value = true;
  await sleep(2);
  loading.value = false;
  toast.success('Succesfully created job');
}
</script>