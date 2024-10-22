<template>
  <div>
    <TopBar :title="'Job Builder'" :subtitle="'Create and deploy job definition files'"></TopBar>
    <div v-if="step === 'job-definition'">
      <div v-if="loadingTemplates && templateId">Loading template..</div>
      <form @submit.prevent="market = null; step = 'pick-market'" v-else>
        <div class="box">
          <div class="columns">
            <div class="column is-7">
              <div class="tabs">
                <ul>
                  <li :class="{ 'is-active': tab === 'builder' }">
                    <a :class="{ 'is-disabled': !jobDefinition }" @click="tab = 'builder'"
                      class="is-justify-content-flex-start">BUILDER</a>
                  </li>
                  <li :class="{ 'is-active': tab === 'json' }">
                    <a @click="info = null; tab = 'json'" class="is-justify-content-flex-start">JSON</a>
                  </li>
                </ul>
              </div>
              <div v-if="tab === 'builder'">
                <div v-for="(op, i) in jobDefinition.ops" class="box has-background-white-ter">
                  <a v-if="jobDefinition.ops.length > 1" class="is-pulled-right"
                    @click="jobDefinition.ops.splice(i, 1)">remove</a>
                  <div class="field" v-if="op">
                    <label class="label">Operation Identifier <span class="has-text-danger">*</span></label>
                    <div class="control">
                      <input @focus="info = 'ops.id'" required class="input" v-model="op.id" type="text"
                        placeholder="id">
                    </div>
                  </div>

                  <div class="field">
                    <label class="label">Type <span class="has-text-danger">*</span></label>
                    <div class="control">
                      <div class="select">
                        <select v-model="op.type" required @focus="info = 'ops.type'" @change="
                          op.type === 'container/create-volume' ? op.args = { name: 'volume-name-' + (i + 1) } :
                            op.type === 'container/run' ? op.args = { image: 'ubuntu', gpu: true } : null">
                          <option value="container/run">Docker command</option>
                          <option value="container/create-volume">Create volume</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div v-if="op.type === 'container/run'">
                    <div class="field">
                      <label class="label">Docker Image <span class="has-text-danger">*</span></label>
                      <div class="control has-icons-left has-icons-right">
                        <input class="input" @focus="info = 'ops.args.image'" required
                          v-model="(op.args as OperationArgsMap['container/run']).image" type="text"
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
                      <label class="label">Command</label>
                      <div class="control">
                        <div
                          v-if="typeof (op.args as OperationArgsMap['container/run']).cmd === 'string' || !(op.args as OperationArgsMap['container/run']).cmd">
                          <input @focus="info = 'ops.args.cmd'" class="input"
                            @change="(op.args as OperationArgsMap['container/run']).cmd === '' ? (op.args as OperationArgsMap['container/run']).cmd = undefined : null"
                            v-model="(op.args as OperationArgsMap['container/run']).cmd" type="text" placeholder="cmd">
                          <p class="is-size-7">
                            <b>Shell</b> form<span class="ml-2"><a
                                @click="(op.args as OperationArgsMap['container/run']).cmd = switchCmd((op.args as OperationArgsMap['container/run']).cmd, 'exec')">Switch
                                to exec form</a></span>
                          </p>
                        </div>
                        <div v-else-if="Array.isArray((op.args as OperationArgsMap['container/run']).cmd)">
                          <div v-for="(cmd, i) in (op.args as OperationArgsMap['container/run']).cmd">
                            <div class="field has-addons">
                              <p class="control is-expanded">
                                <input class="input" @focus="info = 'ops.args.cmd'"
                                  v-model="(op.args as OperationArgsMap['container/run']).cmd![i]" type="text"
                                  placeholder="cmd">
                              </p>
                              <p class="control">
                                <a class="button"
                                  @click="info = 'ops.args.cmd'; ((op.args as OperationArgsMap['container/run']).cmd! as string[]).splice(i, 1)">
                                  <span class="icon is-small">
                                    <TrashIcon />
                                  </span>
                                </a>
                              </p>
                            </div>
                          </div>
                          <a class="button is-small is-primary is-pulled-right mt-2"
                            @click="info = 'ops.args.cmd'; ((op.args as OperationArgsMap['container/run']).cmd! as string[]).push('')">
                            <span>Add cmd</span>
                            <span class="icon">+</span>
                          </a>
                          <p class="is-size-7">
                            <b>Exec</b> form<span class="ml-2"><a
                                @click="(op.args as OperationArgsMap['container/run']).cmd = switchCmd((op.args as OperationArgsMap['container/run']).cmd, 'shell')">Switch
                                to shell form</a></span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div class="field">
                      <label class="label">Expose port</label>
                      <div class="control">
                        <input class="input" @focus="info = 'ops.args.expose'" required
                          @change="(op.args as OperationArgsMap['container/run']).expose === '' ? (op.args as OperationArgsMap['container/run']).expose = undefined : null"
                          v-model.number="(op.args as OperationArgsMap['container/run']).expose" type="number"
                          placeholder="80">
                      </div>
                    </div>
                    <div class="field">
                      <label class="label">Environment variables</label>
                      <div class="control">
                        <div v-for="(env, i) in (op.args as OperationArgsMap['container/run']).env">
                          <div class="field has-addons is-horizontal">
                            <div class="field-label is-normal">
                              <label class="label">{{ i }}</label>
                            </div>
                            <p class="control is-expanded">
                              <input class="input" @focus="info = 'ops.args.env'"
                                v-model="(op.args as OperationArgsMap['container/run']).env![i]" type="text"
                                placeholder="value">
                            </p>
                            <p class="control">
                              <a class="button"
                                @click="info = 'ops.args.env'; delete ((op.args as OperationArgsMap['container/run']).env! as any)[i]">
                                <span class="icon is-small">
                                  <TrashIcon />
                                </span>
                              </a>
                            </p>
                          </div>
                        </div>
                        <div class="field has-addons has-addons-right mt-2">
                          <p class="control">
                            <input class="input is-small" @focus="info = 'ops.args.env'" v-model="envName[i]"
                              type="text" placeholder="env name">
                          </p>
                          <p class="control">
                            <a class="button is-primary is-small"
                              :class="{ 'is-disabled': !envName[i] || !envName[i].length }"
                              @click="info = 'ops.args.env'; !(op.args as OperationArgsMap['container/run']).env ? (op.args as OperationArgsMap['container/run']).env = {} : null; ((op.args as OperationArgsMap['container/run']).env!)[envName[i]] = ''; envName[i] = null">
                              <span>Add env</span>
                              <span class="icon">+</span>
                            </a>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div class="field">
                      <div class="control">
                        <label class="checkbox">
                          <input type="checkbox" @focus="info = 'ops.args.gpu'"
                            v-model="(op.args as OperationArgsMap['container/run']).gpu" />
                          Enable GPU
                        </label>
                      </div>
                    </div>
                    <div class="field">
                      <div class="control">
                        <label class="checkbox">
                          <input type="checkbox" @focus="info = 'ops.args.private'"
                            v-model="(op.args as OperationArgsMap['container/run']).private" />
                          Private
                        </label>
                      </div>
                    </div>
                  </div>
                  <div v-else-if="op.type === 'container/create-volume'">
                    <div class="field">
                      <label class="label">Name <span class="has-text-danger">*</span></label>
                      <div class="control">
                        <input class="input" @focus="info = 'ops.args.name'" required
                          v-model="(op.args as OperationArgsMap['container/create-volume']).name" type="text"
                          placeholder="Name">
                      </div>
                    </div>
                  </div>
                </div>
                <div class="field is-grouped is-grouped-right">
                  <p class="control">
                    <a class="button is-primary is-small" @click="jobDefinition.ops.push({
                      id: 'operation-' + (jobDefinition.ops.length + 1), type: 'container/run', args: { image: 'ubuntu', gpu: true }
                    })">
                      <span>Add operation</span>
                      <span class="icon">+</span>
                    </a>
                  </p>
                </div>
              </div>
              <div v-else-if="tab === 'json'">
                <div class="field">
                  <div class="control" :class="{ 'is-loading': loading }">
                    <JsonEditorVue :onRenderMenu="onRenderMenu" :validator="validator"
                      :class="{ 'jse-theme-dark': $colorMode.value === 'dark' }" v-model="jobDefinition"
                      :mode="Mode.text" :mainMenuBar="true" :stringified="false" />
                  </div>
                </div>
              </div>
            </div>
            <div class="column is-5">
              <div class="box has-background-white-ter">
                <h2 class="title is-5">
                  <span v-if="template">
                    {{ template.name }}
                  </span>
                  <span v-else>Information</span>
                </h2>
                <p class="block">
                  <span v-if="template">
                    {{ template.description }}
                  </span>
                  <span v-else>The Nosana Job schema allows us to create a job definition and specify the parameters
                    needed for our
                    job.</span>
                </p>
                <p class="block">
                  <span v-if="!info">
                    <i v-if="tab === 'builder'">Click on a field to get more information about it</i>
                    <a v-else href="https://docs.nosana.io/inference/writing_a_job.html#job-schema-specification"
                      target="_blank">View Job Schema Specification ⯈</a>
                  </span>
                  <span v-else-if="info === 'ops.id'">
                    <b>id:</b> A unique identifier for the operation.
                  </span>
                  <span v-else-if="info === 'ops.type'">
                    <b>type:</b> Specifies the operation type. For instance, "container/run" indicates a containerized
                    operation.
                  </span>
                  <span v-else-if="info === 'ops.args.image'">
                    <b>image:</b> The Docker image to be used for the container.
                  </span>
                  <span v-else-if="info === 'ops.args.cmd'">
                    <b>cmd:</b> The command(s) to be executed in the container.<br>
                    <a href="https://www.docker.com/blog/docker-best-practices-choosing-between-run-cmd-and-entrypoint/"
                      target="_blank">Learn more about docker CMD</a>
                  </span>
                  <span v-else-if="info === 'ops.args.expose'">
                    <b>expose:</b> A number representing the application port that needs to be exposed via the Nosana
                    Service Endpoint.
                  </span>
                  <span v-else-if="info === 'ops.args.gpu'">
                    <b>gpu:</b> A boolean indicating whether GPU resources are required.
                  </span>
                  <span v-else-if="info === 'ops.args.private'">
                    <b>private:</b> A boolean indicating whether the job definition file, exposed service and the
                    results
                    should be private.
                  </span>
                  <span v-else-if="info === 'ops.args.name'">
                    <b>name:</b> Volume name of the docker volume that will be created.
                  </span>
                  <span v-else-if="info === 'ops.args.env'">
                    <b>env:</b> Key value map for environment variables in the container.
                  </span>
                </p>
                <MarkdownFile v-if="template" :name="'README.md'" :raw-markdown="template.readme" />
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
              <a class="button is-primary" @click="saveToFile()">
                <span>Save File</span>
              </a>
            </p>
          </div>
        </div>
        <div class="field is-grouped is-grouped-right">
          <p class="control">
            <button :disabled="!jobDefinition ? true : undefined" :class="{ 'is-loading': loading }"
              class="button is-primary is-large" type="submit">
              <span>Next</span>
            </button>
          </p>
        </div>
      </form>
    </div>
    <div v-else-if="step === 'pick-market'">
      <h2 class="title is-4">Pick a market to post your job to</h2>
      <ExplorerMarketList :markets="markets" :select="true"
        @selectedMarket="(selectedMarket) => { market = selectedMarket }"></ExplorerMarketList>
      <div v-if="!loadingMarkets && !markets">Could not load markets</div>
      <div v-if="market">
        <div>Selected market:
          <span v-if="
            testgridMarkets.find((tgm: any) => tgm.address === market!.address.toString())
          " class="py-2">
            {{
              testgridMarkets.find((tgm: any) => tgm.address === market!.address.toString()).name
            }}
          </span>
          <span v-else class="is-family-monospace py-2 address">
            {{ market.address.toString() }}
          </span>
        </div>
        <div>Max price: {{ ((market.jobPrice * market.jobTimeout) / 1e6).toFixed(4) }} NOS</div>
        <div>Max duration: {{ market.jobTimeout / 60 }} minutes</div>
        <div>Network fee (10%): {{ (((market.jobPrice * market.jobTimeout) / 1e6) * 0.1).toFixed(4) }} NOS</div>
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
      <form @submit.prevent="postJob">
        <div class="field is-grouped is-grouped-right">
          <p class="control">
            <a @click="step = 'job-definition'" :class="{ 'is-loading': loading }"
              class="button is-primary is-large is-outlined">
              <span>Previous</span>
            </a>
          </p>
          <p class="control">
            <ClientOnly>
              <wallet-modal-provider v-if="!connected" :dark="$colorMode.value === 'dark'">
                <template #default="modalScope">
                  <a class="button is-primary is-large" @click="modalScope.openModal()">
                    Connect Wallet
                  </a>
                </template>
              </wallet-modal-provider>
              <button v-else :disabled="!jobDefinition || !market ? true : undefined" :class="{ 'is-loading': loading }"
                class="button is-primary is-large" type="submit">
                <span>Create Job</span>
              </button>
            </ClientOnly>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>
<script lang="ts" setup>
import JsonEditorVue from 'json-editor-vue';
import 'vanilla-jsoneditor/themes/jse-theme-dark.css'
import TrashIcon from '@/assets/img/icons/trash.svg?component';
import { faSave } from '@fortawesome/free-regular-svg-icons';
import { faUpload } from '@fortawesome/free-solid-svg-icons';
import { Mode, type MenuItem, parseJSONPath, ValidationSeverity, type ValidationError } from 'vanilla-jsoneditor'
import { sleep, validateJobDefinition, type IValidation, type JobDefinition, type Market, type OperationArgsMap } from "@nosana/sdk";
import { WalletModalProvider, useWallet } from "solana-wallets-vue";
import { useToast } from "vue-toastification";
import type { LocationQueryValue } from 'vue-router';
const { templates, emptyJobDefinition, loadingTemplates } = useTemplates();
const route = useRoute();
const templateId: Ref<LocationQueryValue> = ref(route.query.templateId as LocationQueryValue);
const template: ComputedRef<Template | undefined> = computed(() => {
  return templates.value ? templates.value.find(t => t.id === templateId.value) : undefined;
})
const toast = useToast();
const { markets, getMarkets, loadingMarkets } = useMarkets();
const { data: testgridMarkets } = await useAPI('/api/markets', { default: () => [] });

if (!markets.value && !loadingMarkets.value) {
  getMarkets();
}

const step: Ref<string> = ref('job-definition');
const tab: Ref<string> = ref('builder');
const info: Ref<string | null> = ref(null);
const market: Ref<Market | null> = ref(null);
const loading: Ref<boolean> = ref(false);
const { connected, publicKey } = useWallet();
const { balance, refreshBalance, loadingBalance, errorBalance } = useStake(publicKey);
const jobDefinition: Ref<JobDefinition> = useLocalStorage('job-definition', emptyJobDefinition)
const envName: Ref<string[]> = ref([]);
if (template.value) {
  jobDefinition.value = template.value.jobDefinition;
}
watch(() => template.value, async (newValue: Template | undefined) => {
  if (newValue) {
    jobDefinition.value = newValue.jobDefinition;
  }
})
watch(() => jobDefinition.value, async (newValue: any) => {
  if (newValue === "") {
    await nextTick();
    jobDefinition.value = template.value ? template.value.jobDefinition : emptyJobDefinition;
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

const switchCmd = (cmd: string | string[] | undefined, type: 'exec' | 'shell') => {
  if (type === 'exec' && (typeof cmd === 'string' || !cmd)) {
    if (!cmd) {
      cmd = [];
    } else {
      cmd = cmd.split(' ');
    }
  } else if (type === 'shell' && Array.isArray(cmd)) {
    cmd = cmd.join(' ')
  }
  return cmd;
}

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