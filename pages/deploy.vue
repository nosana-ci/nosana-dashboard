<template>
  <div>
    <TopBar
      :title="'Create your Deployment'"
      :subtitle="'Choose the best fit for your needs'"
      ref="topBar"
      :hide-buttons="true"
      v-model="showSettingsModal"
    ></TopBar>
    <div class="columns is-multiline">
      <div class="column is-9-fullhd is-12">
        <!-- Choose model -->
        <h2 class="title py-4">1. Define your model</h2>
        <div class="nav-tabs is-flex">
          <div
            class="nav-tabs-item p-3 px-5 mr-3"
            :class="{ 'is-active has-background-white': navTab === 'choose' }"
            @click="navTab = 'choose'"
          >
            Templates
          </div>
          <div
            class="nav-tabs-item p-3 px-5"
            :class="{ 'is-active has-background-white': navTab === 'builder' }"
            @click="navTab = 'builder'"
          >
            Advanced Builder
          </div>
        </div>
        <div
          class="box has-background-white"
          style="height: 600px; overflow-y: scroll; border: none;"
        >
          <div v-if="navTab === 'choose'">
            <div class="flex">
              <div class="field is-flex category-filters">
                <div class="field">
                  <div class="control">
                    <div class="select is-fullwidth">
                      <select v-model="selectedCategory">
                        <option :value="null">All Models</option>
                        <option
                          v-for="category in ALL_CATEGORIES"
                          :key="category"
                          :value="category"
                        >
                          {{ category }}
                        </option>
                      </select>
                    </div>
                  </div>
                </div>

                <div class="field ml-4">
                  <div class="control">
                    <div class="select is-fullwidth">
                      <select v-model="selectedInterfaceCategory">
                        <option :value="null">All Interface Categories</option>
                        <option
                          v-for="category in INTERFACE_CATEGORIES"
                          :key="category"
                          :value="category"
                        >
                          {{ category }}
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
                <div class="field ml-4">
                  <div class="control has-icons-left">
                    <input
                      class="input"
                      type="text"
                      v-model="search"
                      placeholder="Search model"
                    />
                    <span class="icon is-small is-left">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/>
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div class="columns is-multiline mt-3">
              <div
                v-for="template in filteredTemplates"
                :key="template.id"
                class="column is-6-fullhd is-6-desktop is-6-tablet is-12-mobile"
              >
                <div
                  class="box template-card has-background-white-ter"
                  @click="selectTemplate(template)"
                  :class="{
                    'selected-card':
                      selectedTemplate && selectedTemplate.id === template.id,
                  }"
                >
                  <span v-if="getCategoryArray(template.category).includes('New')" class="new-badge">New</span>
                  <div class="template-header is-fullwidth">
                    <div class="is-flex is-justify-content-space-between">
                      <label class="checkbox is-flex">
                        <input 
                          type="checkbox" 
                          :checked="selectedTemplate?.id === template.id"
                          style="transform: scale(1.3);" 
                          class="green-checkbox"
                          @click.stop="selectTemplate(template)"
                        />
                      </label>
                      <div>
                        <span
                          v-if="template.stargazers_count"
                          class="github-stars"
                        >
                          <img
                            src="~/assets/img/icons/github.svg"
                            class="github-icon"
                            alt="GitHub"
                          />
                          <span
                            class="has-text-warning mr-1"
                            style="font-size: 12px"
                            >★</span
                          >
                          <span class="ml-1">{{
                            String(template.stargazers_count)
                          }}</span>
                        </span>
                        <span v-else class="star-placeholder"></span>
                      </div>
                    </div>
                    <div class="header-content mt-1">
                      <div class="header-title">
                        <h2
                          class="is-size-4 has-text-weight-semibold mb-0 has-text-black"
                        >
                          {{ template.name }}
                        </h2>
                      </div>
                      <div class="header-meta">
                        <div
                          v-if="template.icon || template.avatar_url"
                          class="template-icon"
                        >
                          <img :src="template.icon || template.avatar_url" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="template-description">
                    <p class="has-text-grey" style="font-size: 12px !important">
                      {{ template.description }}
                    </p>
                    <div class="template-tags mt-3">
                      <span
                        v-for="cat in getCategoryArray(
                          template.category
                        ).filter((c) => !['Featured', 'New'].includes(c))"
                        :key="cat"
                        class="tag has-background-white"
                      >
                        {{ cat }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="navTab === 'builder'">
            <div class="columns builder-columns">
              <div class="column" :class="{ 'is-7': showTemplateInfo, 'is-12': !showTemplateInfo }">
                <div class="field full-height">
                  <div class="control full-height">
                    <JsonEditorVue :validator="validator" :class="{ 'jse-theme-dark': $colorMode.value === 'dark' }" 
                      v-model="jobDefinition" :mode="Mode.text" :mainMenuBar="true" :stringified="false" class="full-height-editor" />
                  </div>
                </div>
              </div>
              <div v-if="showTemplateInfo" class="column is-5">
                <div class="box has-background-white-ter h-100">
                  <div class="template-info">
                    <template v-if="selectedTemplate">
                      <div class="template-header">
                        <div class="header-content">
                          <div class="header-title">
                            <h2 class="is-size-4 has-text-weight-semibold mb-0 has-text-black">
                              {{ selectedTemplate.name }}
                            </h2>
                          </div>
                          <div class="header-meta">
                            <span v-if="selectedTemplate.stargazers_count" class="github-stars">
                              <img src="~/assets/img/icons/github.svg" class="github-icon" alt="GitHub">
                              <span class="has-text-warning mr-1" style="font-size: 12px;">★</span>
                              <span class="ml-1">{{ String(selectedTemplate.stargazers_count) }}</span>
                            </span>
                            <span v-else class="star-placeholder"></span>
                            <div v-if="selectedTemplate.icon || selectedTemplate.avatar_url" class="template-icon">
                              <img :src="selectedTemplate.icon || selectedTemplate.avatar_url">
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="markdown-content">
                        <div v-if="selectedTemplate.readme">
                          <MarkdownFile :raw-markdown="selectedTemplate.readme" />
                        </div>
                        <div v-else>
                          <p>{{ selectedTemplate.description }}</p>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Define deployment -->
        <h2 class="title py-4">2. Select your GPU</h2>
        <div class="nav-tabs is-flex">
          <div
            class="nav-tabs-item p-3 px-5 mr-3"
            :class="{ 'is-active has-background-white': gpuTab === 'simple' }"
            @click="gpuTab = 'simple'"
          >
            Device
          </div>
          <div
            class="nav-tabs-item p-3 px-5 mr-3"
            :class="{ 'is-active has-background-white': gpuTab === 'advanced' }"
            @click="gpuTab = 'advanced'"
          >
            Advanced Search
          </div>
        </div>
        <div class="box has-background-white" style="border: none;">
          <div v-if="gpuTab === 'simple'">
            <div class="flex">
              <div class="field px-1 mt-5 mb-5">
                <div class="control">
                  <div class="checkboxes is-flex">
                    <button 
                      class="button button-filter mr-3"
                      :class="{ 'is-selected is-primary': activeFilter === 'ALL', 'is-outlined': activeFilter !== 'ALL' }"
                      @click="toggleGpuType('ALL')"
                    >
                      All
                    </button>
                    <button 
                      class="button button-filter mr-3"
                      :class="{ 'is-selected is-primary': activeFilter === 'PREMIUM', 'is-outlined': activeFilter !== 'PREMIUM' }"
                      @click="toggleGpuType('PREMIUM')"
                    >
                      Premium
                    </button>
                    <button 
                      class="button button-filter"
                      :class="{ 'is-selected is-primary': activeFilter === 'COMMUNITY', 'is-outlined': activeFilter !== 'COMMUNITY' }"
                      @click="toggleGpuType('COMMUNITY')"
                    >
                      Community
                    </button>
                  </div>
                </div>
              </div>
              <div v-if="loadingMarkets">
                Loading GPUs...
              </div>
              <ListDeployMarketList
                v-else-if="markets"
                :key="`market-list-${activeFilterKey}`"
                :markets="markets"
                :testgridMarkets="testgridMarkets"
                :select="true"
                :typeFilter="gpuTypeCheckbox"
                :jobDefinition="jobDefinition"
                :isFromRepost="isFromRepost"
                :skipAutoSelection="skipAutoSelection"
                :initialMarket="selectedMarket"
                :showLogo="true"
                @selectedMarket="selectedMarket = $event"
              />
              <div v-else>
                Could not load available GPUs
              </div>
            </div>
          </div>
          <div v-else-if="gpuTab === 'advanced'">
            <div class="advanced-gpu-selection">
              <div class="content">
                <h3 class="title is-5 mb-4">Advanced GPU Configuration</h3>
                
                <!-- GPU Group Selection -->
                <div class="field">
                  <label class="label has-text-weight-bold has-text-black">GPU Model</label>
                  <div class="control">
                    <div class="select is-fullwidth">
                      <select v-model="selectedGpuGroup" @change="debouncedSearch">
                        <option v-for="group in gpuFilters?.groups" 
                                :key="group.value" 
                                :value="group.value">
                          {{ group.label }}
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <!-- CUDA Driver Selection -->
                <div class="field">
                  <label class="label has-text-weight-bold has-text-black">CUDA Driver</label>
                  <div class="control">
                    <div class="select is-fullwidth">
                      <select v-model="filterValues.CUDA_DRIVER" @change="debouncedSearch">
                        <option v-for="value in getCudaDriverValues()" 
                                :key="value" 
                                :value="value">
                          {{ value }}
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <!-- Market Type Selection - Replace dropdown with buttons matching simple tab -->
                <div class="field">
                  <label class="label has-text-weight-bold has-text-black">Type</label>
                  <div class="control">
                    <div class="checkboxes is-flex">
                      <button 
                        class="button button-filter mr-3"
                        :class="{ 'is-selected is-primary': selectedMarketType === 'all', 'is-outlined': selectedMarketType !== 'all' }"
                        @click="selectedMarketType = 'all'"
                      >
                        All
                      </button>
                      <button 
                        class="button button-filter mr-3"
                        :class="{ 'is-selected is-primary': selectedMarketType === 'premium', 'is-outlined': selectedMarketType !== 'premium' }"
                        @click="selectedMarketType = 'premium'"
                      >
                        Premium
                      </button>
                      <button 
                        class="button button-filter"
                        :class="{ 'is-selected is-primary': selectedMarketType === 'community', 'is-outlined': selectedMarketType !== 'community' }"
                        @click="selectedMarketType = 'community'"
                      >
                        Community
                      </button>
                    </div>
                  </div>
                </div>
                
                <!-- Dynamic Filters -->
                <template v-if="gpuFilters">
                  <div v-for="(filter, key) in getCurrentFilters()" 
                        :key="key" 
                        class="field"
                        v-show="key !== 'UPLOAD_SPEED_MB' && key !== 'MARKET_TYPE' && key !== 'CUDA_DRIVER'">
                    <label class="label">
                      <span class="has-text-weight-bold has-text-black">{{ getFilterLabel(String(key)) }}</span>
                      <span v-if="filter.type === 'min-max'" class="has-text-grey is-size-7 ml-2">- {{ getFilterDescription(String(key)) }} -</span>
                    </label>
                    
                    <!-- Select Type Filters -->
                    <div v-if="filter.type === 'select'" class="control">
                      <!-- Button-style filters for OS and Region -->
                      <div v-if="shouldUseButtonsForFilter(String(key))" class="checkboxes is-flex flex-wrap">
                        <button 
                          v-for="value in filter.values"
                          :key="value" 
                          class="button button-filter mr-2 mb-2"
                          :class="{ 'is-selected is-primary': filterValues[key] === value, 'is-outlined': filterValues[key] !== value }"
                          @click="filterValues[key] = value; debouncedSearch()"
                        >
                          {{ value }}
                        </button>
                      </div>
                      <!-- Standard dropdown for other select filters -->
                      <div v-else class="select is-fullwidth">
                        <select v-model="filterValues[key]" @change="debouncedSearch">
                          <option v-for="value in filter.values" 
                                  :key="value" 
                                  :value="value">
                            {{ value }}
                          </option>
                        </select>
                      </div>
                    </div>

                    <!-- Min-Max Type Filters -->
                    <div v-if="filter.type === 'min-max'" class="control">
                      <div class="field">
                        <div class="columns is-mobile is-vcentered">
                          <div class="column is-9">
                            <div class="slider-container">
                              <div class="range-slider">
                                <div class="range-slider__fill" 
                                    :style="{ width: `${calculateFillWidth(String(key), filterValues[key] as FilterValue, filter)}%` }">
                                </div>
                                <input type="range" 
                                      class="range-slider__range" 
                                      :min="getMinValue(String(key), filter)"
                                      :max="getMaxInputValue(String(key), filter)"
                                      :value="getDisplayValue(String(key), (filterValues[key] as FilterValue).min)"
                                      @input="(e) => handleSliderInput(e, String(key))"
                                      @change="debouncedSearch"
                                      step="1">
                              </div>
                            </div>
                          </div>
                          <div class="column is-3">
                            <div class="input-with-unit">
                              <input class="input" 
                                    type="text" 
                                    inputmode="numeric" 
                                    pattern="[0-9]*"
                                    :value="getDisplayValue(String(key), (filterValues[key] as FilterValue).min)"
                                    @input="(e) => handleSliderInput(e, String(key))" 
                                    :min="getMinValue(String(key), filter)"
                                    :max="getMaxInputValue(String(key), filter)"
                                    :placeholder="'Min ' + String(key).replace(/_/g, ' ').toLowerCase()">
                              <span class="unit">{{ getUnit(String(key)) }}</span>
                              <span class="max-value">/ {{ getMaxValue(String(key), filter.max_value) }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- Available Hosts -->
                <div class="mt-4">
                  <h4 class="title is-6 mb-3">Available GPUs</h4>
                  <div v-if="availableHosts.length === 0 && !loadingHosts" class="has-text-centered has-text-grey">
                    No GPUs found matching your criteria
                  </div>
                  <transition-group name="gpu-list-transition" tag="div" class="gpu-list">
                    <div v-for="host in availableHosts" 
                        :key="host.host_address" 
                        class="gpu-box"
                        :class="{ 'is-selected': selectedHostAddress === host.host_address }"
                        @click="selectHost(host)">
                      <div class="gpu-box__selection-indicator"></div>
                      <div class="gpu-box__content">
                        <div class="gpu-box__main">
                          <div class="gpu-box__title">
                            <img src="~/assets/img/icons/nvidia.svg" alt="NVIDIA" class="gpu-logo" />
                            {{ host.label }}
                          </div>
                          <div class="gpu-box__price">${{ (Number(host.USD_per_hour) * 1.1).toFixed(3) }}/hour</div>
                        </div>
                        <div class="gpu-box__specs">
                          <div class="gpu-box__specs-row">
                            <span class="has-text-grey">vCPU: {{ host.specs.CPU_CORES }} cores</span>
                            <span class="has-text-grey">Memory: {{ host.specs.RAM_MB ? Math.round(host.specs.RAM_MB / 1024) : host.specs.MEMORY_GB || 0 }} GB</span>
                            <span class="has-text-grey">Storage: {{ host.specs.DISK_SPACE_GB }} GB</span>
                          </div>
                          <div class="gpu-box__specs-row">
                            <span class="has-text-grey">Download: {{ Math.round(host.specs.DOWNLOAD_SPEED_MB || host.specs.BANDWIDTH_MB || 0) }} MB/s</span>
                            <span class="has-text-grey">Upload: {{ Math.round(host.specs.UPLOAD_SPEED_MB || 0) }} MB/s</span>
                            <span class="has-text-grey">OS: {{ host.specs.PLATFORM_OS || '?' }}</span>
                          </div>
                          <div class="gpu-box__specs-row">
                            <span class="has-text-grey">Type: {{ host.market_type ? host.market_type.charAt(0).toUpperCase() + host.market_type.slice(1) : '-' }}</span>
                            <span class="has-text-grey" v-if="host.country">Country: {{ getCountryName(host.country) }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </transition-group>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="column is-3-fullhd is-12">
        <div class="summary">
          <div class="is-flex is-justify-content-flex-end" style="margin-bottom: 32px;">
            <button class="button mr-2 is-rounded is-large is-text" @click="showSettingsModal = true">
              <span class="icon">
                <svg width="32" height="32" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6.71971 1.2926L6.41471 2.9726C6.11846 3.06573 5.83097 3.18635 5.55971 3.32761L4.14971 2.35761L2.33979 4.16753L3.31479 5.57252C3.17292 5.84439 3.05355 6.13003 2.95979 6.42753L1.27979 6.73252V9.29252L2.95979 9.59751C3.05354 9.89564 3.17729 10.18 3.31979 10.4525L2.33979 11.8575L4.14971 13.6674L5.5547 12.6974C5.82719 12.8399 6.11657 12.9587 6.4147 13.0524L6.71969 14.7324H9.27969L9.58468 13.0524C9.88218 12.9587 10.1678 12.8393 10.4397 12.6974L11.8447 13.6674L13.6546 11.8575L12.6796 10.4525C12.8208 10.1813 12.9415 9.89878 13.0346 9.60252L14.7196 9.29252V6.73252L13.0346 6.42753C12.9415 6.1319 12.8252 5.84815 12.6846 5.57753L13.6546 4.16753L11.8447 2.35761L10.4397 3.32761C10.1678 3.18574 9.88218 3.06636 9.58468 2.9726L9.27969 1.2926H6.71971ZM7.9997 4.9726C9.67842 4.9726 11.0397 6.33385 11.0397 8.0126C11.0397 9.69135 9.67846 11.0526 7.9997 11.0526C6.32095 11.0526 4.95971 9.69135 4.95971 8.0126C4.95971 6.33385 6.32095 4.9726 7.9997 4.9726Z" fill="currentColor"></path>
                </svg>
              </span>
            </button>
            <ClientOnly>
              <wallet-multi-button :dark="$colorMode.value === 'dark'"></wallet-multi-button>
            </ClientOnly>
          </div>
          <h1 class="title is-4 mb-2">Summary</h1>
          <div class="box has-background-white" style="border: none;">
            <div class="is-flex is-justify-content-space-between">
              <h3 class="title is-4">Price</h3>
              <h3 class="title is-4" v-if="selectedMarket">
                ${{ hourlyPrice.toFixed(3) }} / h
              </h3>
              <p v-else>Select a GPU</p>
            </div>
            <div class="is-flex is-justify-content-space-between has-text-grey">
              <p>Model:</p>
              <p v-if="selectedTemplate" style="text-overflow: ellipsis; text-align: right; flex-basis: 70%;">
                {{ selectedTemplate.name }}
              </p>
              <p v-else>-</p>
            </div>
            <div class="is-flex is-justify-content-space-between has-text-grey">
              <p>GPU</p>
              <p v-if="selectedMarket">{{ marketName }}</p>
              <p v-else>-</p>
            </div>
            <div class="mt-4 is-flex is-justify-content-space-between has-text-grey">
              <p>Auto-shutdown time (hours)</p>
              <div class="is-flex is-align-items-center">
                <input
                  class="input"
                  type="number"
                  v-model="hours"
                  min="0"
                  max="500"
                  style="width: 60px; height: 28px;"
                />
                <div class="ml-2"></div>
              </div>
            </div>
            <hr />
            <div class="is-flex is-justify-content-space-between">
              <h3 class="title is-4 mb-0">Total cost</h3>
              <h3 class="title is-4" v-if="selectedMarket">
                ${{ totalPrice.toFixed(3) }}
              </h3>
            </div>
            <hr />
            <ClientOnly>
              <wallet-modal-provider v-if="!connected" :dark="$colorMode.value === 'dark'">
                <template #default="modalScope">
                  <button 
                    class="button is-secondary is-fullwidth"
                    @click="modalScope.openModal()"
                  >
                    Connect Wallet
                  </button>
                </template>
              </wallet-modal-provider>
              <button
                v-else-if="connected && !canPostJob && selectedMarket"
                class="button is-secondary is-fullwidth"
                @click="openSwapModal"
              >
                Swap
              </button>
              <button
                v-else
                class="button is-secondary is-fullwidth"
                :disabled="!canCreateDeployment"
                @click="createDeployment"
              >
                <span v-if="isCreatingDeployment">Creating...</span>
                <span v-else>Create Deployment</span>
              </button>
            </ClientOnly>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Add Swap Modal -->
    <SwapModal
      v-model:showModal="showSwapModal"
      :totalNosNeeded="requiredNos"
      :nosPrice="nosPrice"
      :solPrice="solPrice"
      :usdcPrice="usdcPrice"
      :usdtPrice="usdtPrice"
      :userBalances="userBalances"
      @refresh-balances="refreshAllBalances"
    />
    
  </div>
</template>

<script lang="ts" setup>
import type { Market } from "@nosana/sdk";
import JsonEditorVue from 'json-editor-vue';
import { Mode, ValidationSeverity } from 'vanilla-jsoneditor';
import 'vanilla-jsoneditor/themes/jse-theme-dark.css';
import { useToast } from "vue-toastification";
import { WalletMultiButton, WalletModalProvider, useWallet } from "solana-wallets-vue";
import TopBar from '~/components/TopBar.vue';
import { useRouter, useRoute } from 'vue-router';
import { useDebounceFn } from "@vueuse/core";
import countries from 'i18n-iso-countries';
import en from 'i18n-iso-countries/langs/en.json';
import SwapModal from '~/components/SwapModal.vue';

// Initialize the countries library with English locale
countries.registerLocale(en);

// Country name helper function
const getCountryName = (code: string): string => {
  const countryName = countries.getName(code, 'en') || code;
  
  // Custom country name overrides
  if (code === 'TW') return 'Taiwan';
  if (code === 'US') return 'United States';
  if (code === 'RU') return 'Russia';
  if (code === 'CN') return 'China';
  
  return countryName;
};

// Type definitions
interface Template {
  id?: string;
  name: string;
  description: string;
  category?: string | string[];
  icon?: string;
  avatar_url?: string;
  stargazers_count?: number;
  jobDefinition?: any;
  readme?: string;
}

// Advanced GPU selection types
interface FilterValue {
  min: number;
  max: number;
}

interface FilterValues {
  [key: string]: string | FilterValue;
}

interface HostInterface {
  host_address: string;
  label: string;
  USD_per_hour: number;
  market_address?: string;
  market_type?: string;
  specs: {
    CPU_CORES: number;
    RAM_MB?: number;
    MEMORY_GB?: number;
    DISK_SPACE_GB: number;
    DOWNLOAD_SPEED_MB?: number;
    BANDWIDTH_MB?: number;
    PLATFORM_OS?: string;
    UPLOAD_SPEED_MB?: number;
  };
  country?: string;
}

// Setup composables
const { markets, getMarkets, loadingMarkets } = useMarkets();
const { templates, loadingTemplates } = useTemplates();
const { nosana } = useSDK();
const router = useRouter();
const route = useRoute();
const toast = useToast();
const { connected, publicKey } = useWallet();

// State
const selectedCategory = ref<string | null>(null);
const selectedInterfaceCategory = ref<string | null>(null);
const search = ref("");
const navTab = ref<"choose" | "builder">("choose");
const gpuTab = ref<"simple" | "advanced">("simple");
const gpuTypeCheckbox = ref<string[]>(["PREMIUM"]);
const activeFilter = ref("PREMIUM");
const selectedMarket = ref<Market | null>(null);
const selectedTemplate = ref<Template | null>(null);
const hours = ref(1);
const isCreatingDeployment = ref(false);
const showSettingsModal = ref(false);
const showSwapModal = ref(false);
const isFromRepost = ref(false);
const skipAutoSelection = ref(false);

// Balance and price state
const balance = ref<number>(0);
const loadingBalance = ref(false);
const errorBalance = ref<string | null>(null);
const nosPrice = ref(0);
const solPrice = ref(0);
const usdcPrice = ref(0);
const usdtPrice = ref(0);
const userBalances = ref({
  nos: 0,
  sol: 0,
  usdc: 0,
  usdt: 0
});

// Advanced GPU selection state
const selectedGpuGroup = ref<string>('all');
const selectedMarketType = ref<'all' | 'premium' | 'community'>('premium');
const gpuFilters = ref<any>(null);
const availableHosts = ref<HostInterface[]>([]);
const loadingHosts = ref(false);
const selectedHostAddress = ref<string | null>(null);
const forceUpdateCounter = ref(0);
const config = useRuntimeConfig();

// Initialize filterValues with defaults
const filterValues = ref<FilterValues>({
  PLATFORM_OS: 'All',
  CUDA_DRIVER: 'All',
  CPU_CORES: { min: 0, max: 128 },
  RAM_MB: { min: 12288, max: 131072 }, // 12 GB in MB (default)
  DISK_SPACE_GB: { min: 256, max: 1000 }, // 256 GB (default)
  BANDWIDTH_MB: { min: 100, max: 1000 } // 100 MB/s (default)
});

// Field mappings constants for GPU selection
const FIELD_MAPPINGS = {
  // Frontend to backend parameter mapping
  API_PARAMS: {
    'PLATFORM_OS': 'platform_os',
    'CUDA_DRIVER': 'cuda_drivers',
    'CPU_CORES': 'cpu_cores',
    'RAM_MB': 'ram_mb',
    'DISK_SPACE_GB': 'disk_space_gb',
    'BANDWIDTH_MB': 'download_speed_mb',
    'DOWNLOAD_SPEED_MB': 'download_speed_mb',
    'UPLOAD_SPEED_MB': 'upload_speed_mb',
    'REGION': 'region'
  },
  // Display labels for filters
  LABELS: {
    'PLATFORM_OS': 'Select OS',
    'CUDA_DRIVER': 'Select CUDA driver',
    'CPU_CORES': 'CPU',
    'RAM_MB': 'Memory',
    'DISK_SPACE_GB': 'Storage',
    'BANDWIDTH_MB': 'Download Speed',
    'DOWNLOAD_SPEED_MB': 'Download Speed'
  },
  // Descriptions for sliders
  DESCRIPTIONS: {
    'CPU_CORES': 'Select amount of vCPUs',
    'RAM_MB': 'Set minimum memory in GB',
    'DISK_SPACE_GB': 'Set minimum storage in GB',
    'BANDWIDTH_MB': 'Set the minimum download speed in MB/s',
    'DOWNLOAD_SPEED_MB': 'Set the minimum download speed in MB/s'
  },
  // Units for display values
  UNITS: {
    'CPU_CORES': 'vCPU',
    'RAM_MB': 'GB',
    'DISK_SPACE_GB': 'GB',
    'BANDWIDTH_MB': 'MB/s',
    'DOWNLOAD_SPEED_MB': 'MB/s'
  },
  // Special fields that should start at 0
  ZERO_MIN_FIELDS: ['RAM_MB', 'CPU_CORES', 'DISK_SPACE_GB']
};

// API data
const { data: stats } = await useAPI("/api/stats");
const { data: testgridMarkets } = await useAPI("/api/markets", { default: () => [] });
const nosApiPrice = computed(() => stats.value?.price || 0);

// Default job definition
const jobDefinition = ref({
  version: "1.0.0",
  type: "container",
  ops: [
    {
      id: "operation-1",
      type: "container/run",
      args: {
        image: "ubuntu",
        gpu: true
      }
    }
  ]
});

// Cache NOS price data
interface CachedPrice {
  price: number;
  timestamp: number;
}

const cachedNosPrice = useLocalStorage<CachedPrice>('nos-price-cache', { price: 0, timestamp: 0 });

// Function to check if cache is valid (less than 1 hour old)
const isCacheValid = () => {
  const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
  return Date.now() - cachedNosPrice.value.timestamp < oneHour;
};

// Fetch token prices
const { data: priceData } = await useAPI(
  'https://api.coingecko.com/api/v3/simple/price?ids=nosana,solana,usd-coin,tether&vs_currencies=usd',
  {
    default: () => ({
      nosana: { usd: 0 },
      solana: { usd: 0 },
      'usd-coin': { usd: 0 },
      tether: { usd: 0 }
    })
  }
);

watch(() => priceData.value, (newPrice) => {
  if (newPrice?.nosana?.usd) {
    nosPrice.value = newPrice.nosana.usd;
    // Update cache with new price and timestamp
    cachedNosPrice.value = {
      price: newPrice.nosana.usd,
      timestamp: Date.now()
    };
  } else if (isCacheValid()) {
    // Use cached price if available and valid
    nosPrice.value = cachedNosPrice.value.price;
  } else {
    nosPrice.value = nosApiPrice.value;
  }
  if (newPrice?.solana?.usd) {
    solPrice.value = newPrice.solana.usd;
  }
  if (newPrice?.['usd-coin']?.usd) {
    usdcPrice.value = newPrice['usd-coin'].usd;
  }
  if (newPrice?.tether?.usd) {
    usdtPrice.value = newPrice.tether.usd;
  }
}, { immediate: true });

// Computed properties
const showTemplateInfo = computed(() => 
  selectedTemplate.value && selectedTemplate.value.name !== 'Custom'
);

const marketName = computed(() => {
  if (!selectedMarket.value) return null;
  return testgridMarkets.value.find(
    (tgm: any) => tgm.address === selectedMarket.value?.address.toString()
  )?.name || selectedMarket.value.address.toString();
});

const hourlyPrice = computed(() => 
  selectedMarket.value ? ((selectedMarket.value.jobPrice / 1e6) * 3600 * nosPrice.value * 1.1) : 0
);

const totalPrice = computed(() => hourlyPrice.value * hours.value);

const requiredNos = computed(() => {
  if (!selectedMarket.value || !hours.value) return 0;
  return (selectedMarket.value.jobPrice * hours.value * 3600 * 1.1) / 1e6; // Convert to NOS including 10% fee
});

const canPostJob = computed(() => {
  return (balance.value || 0) >= requiredNos.value * 1.01;
});

const canCreateDeployment = computed(() => 
  !(!selectedMarket.value || (!selectedTemplate.value && !route.query.fromRepost) || isCreatingDeployment.value || hours.value <= 0)
);

const activeFilterKey = computed(() => 
  `${selectedTemplate?.value?.id || 'default'}-${activeFilter.value}`
);

// Validation function
const validator = (json: any) => {
  const errors: { path: string[], message: string, severity: ValidationSeverity }[] = [];
  return errors;
};

// Predefined categories
const ALL_CATEGORIES = [
  "LLM",
  "LLM Fine-tuning",
  "Image Generation",
  "Image Generation Fine-tuning",
] as const;

const INTERFACE_CATEGORIES = ["API", "Website"] as const;

// Methods
const getCategoryArray = (category: string | string[] | undefined): string[] => {
  if (!category) return [];
  if (Array.isArray(category)) {
    return category.map((cat) => (cat === "Web UI" ? "Website" : cat));
  }
  return category.split("|").map((cat) => (cat === "Web UI" ? "Website" : cat));
};

const filteredTemplates = computed(() => {
  if (!templates.value) return [];

  let templatesList = templates.value;
  
  // Filter by search term
  if (search.value) {
    const searchTerm = search.value.toLowerCase();
    templatesList = templatesList.filter(
      (t: Template) =>
        t.name.toLowerCase().includes(searchTerm) ||
        t.description.toLowerCase().includes(searchTerm)
    );
  }

  // Filter by selected categories
  if (selectedCategory.value) {
    templatesList = templatesList.filter((t: Template) => {
      const categoryArray = getCategoryArray(t.category);
      return categoryArray.includes(selectedCategory.value as string);
    });
  }

  if (selectedInterfaceCategory.value) {
    templatesList = templatesList.filter((t: Template) => {
      const categoryArray = getCategoryArray(t.category);
      return categoryArray.includes(selectedInterfaceCategory.value as string);
    });
  }

  // Sort by New flag and stars
  return templatesList.sort((a: Template, b: Template) => {
    const aIsNew = getCategoryArray(a.category).includes("New");
    const bIsNew = getCategoryArray(b.category).includes("New");

    if (aIsNew && !bIsNew) return -1;
    if (!aIsNew && bIsNew) return 1;

    return (b.stargazers_count || 0) - (a.stargazers_count || 0);
  });
});

const toggleGpuType = (type: string) => {
  activeFilter.value = type;
  if (type === 'ALL') {
    gpuTypeCheckbox.value = ['PREMIUM', 'COMMUNITY'];
    selectedMarketType.value = 'all';
  } else {
    gpuTypeCheckbox.value = [type];
    selectedMarketType.value = type.toLowerCase() as 'premium' | 'community';
  }
};

const selectTemplate = (template: Template) => {
  selectedTemplate.value = selectedTemplate.value?.id === template.id ? null : template;
};

const createDeployment = async () => {
  if (!canCreateDeployment.value) return;
  
  // Double-check hours value is valid
  if (hours.value <= 0) {
    toast.error('Auto-shutdown time must be greater than 0');
    return;
  }
  
  isCreatingDeployment.value = true;
  try {
    const ipfsHash = await nosana.value.ipfs.pin(jobDefinition.value);
    const response = await nosana.value.jobs.list(
      ipfsHash,
      hours.value * 3600,
      selectedMarket.value!.address,
      selectedHostAddress.value || undefined
    );
    toast.success(`Successfully created deployment ${response.job}`);
    setTimeout(() => {
      router.push('/jobs/' + response.job);
    }, 3000);
  } catch (error: any) {
    if (error.toString().toLowerCase().includes('user rejected')) {
      toast.info('Transaction was cancelled.');
    } else {
      toast.error(`Error creating deployment: ${error.toString()}`);
    }
  } finally {
    isCreatingDeployment.value = false;
  }
};

// Handle repost if needed
const handleRepost = async () => {
  const repostId = route.query.repostId as string;
  if (!repostId) return;
  
  isFromRepost.value = true;
  skipAutoSelection.value = true;
  
  try {
    // Try to get data from localStorage first
    const storedData = localStorage.getItem(repostId);
    let jobAddress: string;
    let jobTimeout: string | null = null;
    let marketAddress: string | null = null;
    
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      jobAddress = parsedData.jobAddress;
      jobTimeout = parsedData.jobTimeout;
      marketAddress = parsedData.marketAddress;
      
      // Set timeout from localStorage if available
      if (jobTimeout) {
        hours.value = parseFloat(jobTimeout);
      }
    } else {
      // If no localStorage data, we can't proceed
      throw new Error("Repost data not found. The page may have been reloaded or the data expired.");
    }
    
    // Fetch job data from API
    const response = await fetch(`https://dashboard.k8s.prd.nos.ci/api/jobs/${jobAddress}`);
    if (!response.ok) {
      throw new Error(`Failed to load deployment with address ${jobAddress}`);
    }
    
    const jobData = await response.json();
    
    // Wait for markets to load if needed
    if (!markets.value || markets.value.length === 0) {
      await getMarkets();
    }
    
    // Set market from localStorage first if available, then from the original job data
    if (markets.value) {
      let foundMarket = null;
      
      // First try using the marketAddress from localStorage
      if (marketAddress) {
        foundMarket = markets.value.find((m: Market) => 
          m.address.toString() === marketAddress
        );
      }
      
      // Fall back to job data market if needed
      if (!foundMarket && jobData.market) {
        foundMarket = markets.value.find((m: Market) => 
          m.address.toString() === jobData.market
        );
      }
      
      if (foundMarket) {
        selectedMarket.value = foundMarket;
        
        // Set GPU type based on market
        if (testgridMarkets.value.length > 0) {
          const marketInfo = testgridMarkets.value.find((tgm: any) => 
            tgm.address === foundMarket.address.toString()
          );
          if (marketInfo && marketInfo.type) {
            gpuTypeCheckbox.value = [marketInfo.type];
            activeFilter.value = marketInfo.type;
          }
        }
      }
    }
    
    // Set job definition
    if (jobData.jobDefinition) {
      jobDefinition.value = JSON.parse(JSON.stringify(jobData.jobDefinition));
    }
    
    // Set hours/timeout if not already set from localStorage
    if (!jobTimeout && jobData.timeout) {
      hours.value = jobData.timeout / 3600;
    }
    
    // Find and select template or use custom
    if (templates.value && jobData.jobDefinition) {
      const matchingTemplate = templates.value.find((t: Template) => 
        t.jobDefinition && 
        JSON.stringify(t.jobDefinition) === JSON.stringify(jobData.jobDefinition)
      );
      
      if (matchingTemplate) {
        selectedTemplate.value = matchingTemplate;
      } else {
        navTab.value = "builder";
        selectedTemplate.value = {
          name: 'Custom',
          jobDefinition: jobData.jobDefinition,
          description: 'Custom configuration from reposted deployment'
        };
      }
    }
    
    // Clean up localStorage data after successful use
    cleanupLocalStorage(repostId);
    
    // Remove repostId from URL to avoid reuse on refresh
    router.replace({ query: {} });
  } catch (err: any) {
    toast.error(`Error setting up reposted deployment: ${err.toString()}`);
    isFromRepost.value = false;
    skipAutoSelection.value = false;
    
    // Clean up localStorage in case of error too
    if (repostId) {
      cleanupLocalStorage(repostId);
    }
    
    // Remove repostId from URL on error
    router.replace({ query: {} });
  }
};

// Function to clean up localStorage data
const cleanupLocalStorage = (currentRepostId?: string) => {
  // Remove specific repost ID if provided
  if (currentRepostId) {
    localStorage.removeItem(currentRepostId);
  }
  
  // Clean up any old repost data (older than 24 hours)
  const repostPrefix = 'repost-';
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(repostPrefix)) {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const data = JSON.parse(item);
          // If the item is older than 24 hours, remove it
          if (data.timestamp && data.timestamp < oneDayAgo) {
            localStorage.removeItem(key);
          }
        }
      } catch (e) {
        // If we can't parse the item, remove it
        if (key) localStorage.removeItem(key);
      }
    }
  }
};

// Template selection handling
watch(() => selectedTemplate.value, (newTemplate) => {
  if (newTemplate?.jobDefinition) {
    // Update job definition
    jobDefinition.value = JSON.parse(JSON.stringify(newTemplate.jobDefinition));
    
    // Reset market selection for proper reactivity if not a repost
    if (!isFromRepost.value) {
      selectedMarket.value = null;
    }
  } else {
    // Reset job definition in non-repost mode
    jobDefinition.value = {
      version: "1.0.0",
      type: "container",
      ops: [
        {
          id: "operation-1",
          type: "container/run",
          args: {
            image: "ubuntu",
            gpu: true
          }
        }
      ]
    };
    selectedMarket.value = null;
  }
});

// Update GPU type when market changes
watch(() => selectedMarket.value, (newMarket) => {
  if (newMarket && testgridMarkets.value && activeFilter.value !== 'ALL') {
    const marketInfo = testgridMarkets.value.find((tgm: any) => tgm.address === newMarket.address.toString());
    if (marketInfo && marketInfo.type) {
      gpuTypeCheckbox.value = [marketInfo.type];
      activeFilter.value = marketInfo.type;
    }
  }
});

// Advanced GPU Selection Utility Functions
const getFilterLabel = (key: string): string => 
  FIELD_MAPPINGS.LABELS[key as keyof typeof FIELD_MAPPINGS.LABELS] || key;

const getFilterDescription = (key: string): string => 
  FIELD_MAPPINGS.DESCRIPTIONS[key as keyof typeof FIELD_MAPPINGS.DESCRIPTIONS] || 'Set the value';

const getUnit = (key: string): string => 
  FIELD_MAPPINGS.UNITS[key as keyof typeof FIELD_MAPPINGS.UNITS] || '';

const getDisplayValue = (key: string, value: number): number => 
  key === 'RAM_MB' ? Math.round(value / 1024) : value;

const getMaxValue = (key: string, maxValue: number): number => {
  if (key === 'BANDWIDTH_MB' || key === 'DOWNLOAD_SPEED_MB') {
    return Math.round(maxValue);
  }
  return key === 'RAM_MB' ? Math.round(maxValue / 1024) : maxValue;
};

const getMinValue = (key: string, filter: any): number => 
  key === 'BANDWIDTH_MB' || key === 'DOWNLOAD_SPEED_MB' ? 0 : 
  FIELD_MAPPINGS.ZERO_MIN_FIELDS.includes(key) ? 0 : filter.min_value;

const getMaxInputValue = (key: string, filter: any): number => 
  key === 'RAM_MB' ? Math.round(filter.max_value / 1024) : filter.max_value;

// Helper to get current filters safely
const getCurrentFilters = () => {
  if (!gpuFilters.value || !gpuFilters.value['filter-options']) return {};
  
  const option = gpuFilters.value['filter-options'].find(
    (f: { value: string }) => f.value === selectedGpuGroup.value || 
    (!selectedGpuGroup.value && f.value === 'all')
  );
  
  return option?.filters || {};
};

// Helper to check if a filter should use buttons instead of dropdown
const shouldUseButtonsForFilter = (key: string): boolean => {
  return ['PLATFORM_OS', 'REGION'].includes(key);
};

// Get CUDA driver values from current filters
const getCudaDriverValues = (): string[] => {
  if (!gpuFilters.value || !gpuFilters.value['filter-options']) return ['All'];
  
  const option = gpuFilters.value['filter-options'].find(
    (f: { value: string }) => f.value === selectedGpuGroup.value || 
    (!selectedGpuGroup.value && f.value === 'all')
  );
  
  if (option?.filters?.CUDA_DRIVER?.values) {
    return option.filters.CUDA_DRIVER.values;
  }
  
  return ['All'];
};

// Fill width calculator for sliders
const calculateFillWidth = (key: string, filterValue: FilterValue, filter: any): number => {
  // Special handling for bandwidth - always start from 0
  if (key === 'BANDWIDTH_MB' || key === 'DOWNLOAD_SPEED_MB') {
    const maxValue = filter.max_value;
    const currentValue = filterValue.min;
    return (currentValue / maxValue) * 100;
  }
  
  // Special handling for fields that can start from 0
  if (FIELD_MAPPINGS.ZERO_MIN_FIELDS.includes(key)) {
    // Use percentage of max value for these fields
    const maxValue = key === 'RAM_MB' ? Math.round(filter.max_value / 1024) : filter.max_value;
    const currentValue = key === 'RAM_MB' ? Math.round(filterValue.min / 1024) : filterValue.min;
    return (currentValue / maxValue) * 100;
  }
  
  // Standard calculation for other fields
  return ((filterValue.min - filter.min_value) / (filter.max_value - filter.min_value)) * 100;
};

// Slider input handler
const handleSliderInput = (e: Event, key: string) => {
  const value = Number((e.target as HTMLInputElement).value);
  if (!filterValues.value[key]) {
    filterValues.value[key] = { min: 0, max: 0 };
  }
  (filterValues.value[key] as FilterValue).min = key === 'RAM_MB' ? value * 1024 : value;
  forceUpdateCounter.value++;
};

// Host selection handler
const selectHost = (host: HostInterface) => {
  selectedHostAddress.value = selectedHostAddress.value === host.host_address ? null : host.host_address;
  
  // If a host is selected, update selectedMarket based on market_address
  if (selectedHostAddress.value && host.market_address) {
    // Find the market in markets.value that matches the host's market_address
    const matchingMarket = markets.value?.find((m: Market) => 
      m.address.toString() === host.market_address
    );
    
    if (matchingMarket) {
      selectedMarket.value = matchingMarket;
    }
  } else {
    selectedMarket.value = null;
  }
};

// Create a fetchGpuFilters function
const fetchGpuFilters = async (resetValues = true) => {
  try {
    loadingHosts.value = true;
    const response = await fetch(`${config.public.apiBase}/api/deployments/filters?market_type=${selectedMarketType.value}`);
    const data = await response.json();
    
    // Fix the duplicate "All GPUs" issue
    if (data.groups && data.groups.length > 0) {
      // Handle the case where 'all' value might be duplicated
      const allValues = data.groups.filter((group: any) => group.value === 'all');
      if (allValues.length > 1) {
        // Keep only the first 'all' entry
        data.groups = data.groups.filter((group: any, index: number) => {
          if (group.value === 'all') {
            return index === data.groups.findIndex((g: any) => g.value === 'all');
          }
          return true;
        });
      }
      
      // Handle any entries with "All GPUs" label but different values
      const allGpuLabels = data.groups.filter((group: any) => group.label === 'All GPUs');
      if (allGpuLabels.length > 1) {
        // Keep only the first "All GPUs" label
        data.groups = data.groups.filter((group: any, index: number) => {
          if (group.label === 'All GPUs') {
            return index === data.groups.findIndex((g: any) => g.label === 'All GPUs');
          }
          return true;
        });
      }
      
      // Make sure "All GPUs" is always first in the list
      data.groups.sort((a: any, b: any) => {
        if (a.label === 'All GPUs') return -1;
        if (b.label === 'All GPUs') return 1;
        return a.order - b.order;
      });
    }
    
    // Fix filter options to always have "All" at the top of the values list
    if (data['filter-options'] && data['filter-options'].length > 0) {
      data['filter-options'].forEach((option: any) => {
        if (option.filters) {
          Object.values(option.filters).forEach((filter: any) => {
            if (filter.type === 'select' && filter.values && filter.values.length > 0) {
              // Remove any existing 'All' value
              const values = filter.values.filter((v: string) => v !== 'All');
              // Add 'All' at the beginning
              filter.values = ['All', ...values];
            }
          });
        }
      });
    }
    
    gpuFilters.value = data;
    
    // Initialize filter values based on the all group, but only if resetValues is true
    if (resetValues && data['filter-options'] && data['filter-options'].length > 0) {
      const allOption = data['filter-options'].find((opt: any) => opt.value === 'all');
      if (allOption && allOption.filters) {
        // Reset filter values with proper defaults from API
        Object.entries(allOption.filters).forEach(([key, filterConfig]: [string, any]) => {
          if (filterConfig.type === 'select') {
            // Always default select-type filters to 'All'
            filterValues.value[key] = 'All';
          } else if (filterConfig.type === 'min-max') {
            // Set our custom default values regardless of API min values
            if (key === 'RAM_MB') {
              filterValues.value[key] = { min: 12288, max: filterConfig.max_value || 131072 }; // 12 GB
            } else if (key === 'DISK_SPACE_GB') {
              filterValues.value[key] = { min: 256, max: filterConfig.max_value || 1000 }; // 256 GB
            } else if (key === 'BANDWIDTH_MB' || key === 'DOWNLOAD_SPEED_MB') {
              filterValues.value[key] = { min: 100, max: filterConfig.max_value || 1000 }; // Default 100 MB/s
            } else {
              // For other fields like CPU_CORES, use 0 as min
              filterValues.value[key] = { 
                min: key === 'CPU_CORES' ? 0 : filterConfig.min_value || 0,
                max: filterConfig.max_value || 1000 
              };
            }
          }
        });
      }
    }
    
    // Fetch initial hosts with current settings
    await debouncedSearch();
  } catch (error) {
    console.error('Error fetching filters:', error);
    toast.error('Could not load GPU filter options');
  } finally {
    loadingHosts.value = false;
  }
};

// Update the debouncedSearch function to include market_type
const debouncedSearch = useDebounceFn(async () => {
  loadingHosts.value = true;
  
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('group', selectedGpuGroup.value || 'all');
    
    // Add market_type parameter
    queryParams.append('market_type', selectedMarketType.value);
    
    // Add filter values to query
    Object.entries(filterValues.value).forEach(([key, value]) => {
      const paramName = FIELD_MAPPINGS.API_PARAMS[key as keyof typeof FIELD_MAPPINGS.API_PARAMS] || key.toLowerCase();
      
      if (typeof value === 'string') {
        if (value !== 'All') {
          // Keep case for REGION parameter
          const paramValue = key === 'REGION' ? value : value.toLowerCase();
          queryParams.append(paramName, paramValue);
        }
      } else if (value && typeof value === 'object') {
        const filterValue = value as FilterValue;
        if (filterValue.min > 0) {
          // Make sure we're only adding each parameter once
          queryParams.set(paramName, filterValue.min.toString());
        }
      }
    });
    
    // Fetch available hosts
    const response = await fetch(`${config.public.apiBase}/api/deployments/hosts?${queryParams}`);
    const data = await response.json();
    
    // Process host data
    if (data.hosts) {
      const processedHosts = data.hosts
        .map((host: any) => {
          // Normalize host data
          if (host.specs && host.specs.RAM_MB) {
            host.specs.RAM_MB = Number(host.specs.RAM_MB);
            if (!host.specs.MEMORY_GB) {
              host.specs.MEMORY_GB = Math.round(host.specs.RAM_MB / 1024 * 100) / 100;
            }
          }
          
          // Only set market_type if not provided by the API
          if (!host.market_type) {
            host.market_type = selectedMarketType.value;
          }
          
          return host;
        })
        // Sort by price (low to high)
        .sort((a: any, b: any) => a.USD_per_hour - b.USD_per_hour);
      
      // Wait a small delay before updating to ensure smooth transition
      setTimeout(() => {
        availableHosts.value = processedHosts;
        loadingHosts.value = false;
      }, 100);
    } else {
      setTimeout(() => {
        availableHosts.value = [];
        loadingHosts.value = false;
      }, 100);
    }
  } catch (error) {
    console.error('Error fetching hosts:', error);
    toast.error('Failed to fetch available GPUs');
    setTimeout(() => {
      availableHosts.value = [];
      loadingHosts.value = false;
    }, 100);
  }
}, 300);

// Add watchers for selectedMarketType
watch(selectedMarketType, () => {
  // Reset the selected host when market type changes
  selectedHostAddress.value = null;
  // Only fetch filters, don't reset the values
  fetchGpuFilters(false);
});

// Watch for changes to selectedGpuGroup
watch(selectedGpuGroup, async (newValue) => {
  if (newValue !== undefined) {
    // Get the filter configuration for the newly selected group
    if (gpuFilters.value && gpuFilters.value['filter-options']) {
      const groupOption = gpuFilters.value['filter-options'].find(
        (opt: any) => opt.value === newValue
      );
      
      if (groupOption && groupOption.filters) {
        // Check each filter and adjust values if they exceed the new maximum
        Object.entries(groupOption.filters).forEach(([key, filterConfig]: [string, any]) => {
          if (filterConfig.type === 'min-max' && filterValues.value[key]) {
            const currentValue = filterValues.value[key] as FilterValue;
            
            // Special handling for bandwidth - don't update min unless it's above max
            if (key === 'BANDWIDTH_MB' || key === 'DOWNLOAD_SPEED_MB') {
              // Only adjust min if it exceeds max
              if (currentValue.min > filterConfig.max_value) {
                (filterValues.value[key] as FilterValue).min = filterConfig.max_value;
              }
              (filterValues.value[key] as FilterValue).max = filterConfig.max_value;
            }
            // For other filters, if current min value exceeds the new max, adjust it
            else if (currentValue.min > filterConfig.max_value) {
              (filterValues.value[key] as FilterValue).min = filterConfig.max_value;
              (filterValues.value[key] as FilterValue).max = filterConfig.max_value;
            }
            
            // Update the max value to match the filter's max
            (filterValues.value[key] as FilterValue).max = filterConfig.max_value;
          }
        });
      }
    }
    
    // Trigger search with adjusted values
    debouncedSearch();
  }
});

// Update the onMounted hook to use fetchGpuFilters
onMounted(async () => {
  if (!markets.value && !loadingMarkets.value) {
    await getMarkets();
  }
  
  if (route.query.repostId) {
    await handleRepost();
  }

  // Use the new fetchGpuFilters function with resetValues = true for initial loading
  await fetchGpuFilters(true);
  
  // Refresh balances if wallet is connected
  if (publicKey.value && nosana.value) {
    await refreshAllBalances();
  }
  
  // Clean up old repost data
  cleanupLocalStorage();
});

// Watch for tab changes to sync market type
watch(gpuTab, (newTab) => {
  if (newTab === 'simple') {
    // Update the active filter to match the selected market type
    if (selectedMarketType.value === 'all') {
      activeFilter.value = 'ALL';
      gpuTypeCheckbox.value = ['PREMIUM', 'COMMUNITY'];
    } else if (selectedMarketType.value === 'premium') {
      activeFilter.value = 'PREMIUM';
      gpuTypeCheckbox.value = ['PREMIUM'];
    } else if (selectedMarketType.value === 'community') {
      activeFilter.value = 'COMMUNITY';
      gpuTypeCheckbox.value = ['COMMUNITY'];
    }
  }
});

// Refresh NOS balance
const refreshBalance = async () => {
  if (!publicKey.value || !nosana.value) return;
  
  loadingBalance.value = true;
  errorBalance.value = null;
  
  try {
    const balanceData = await nosana.value.solana.getNosBalance(publicKey.value.toString());
    balance.value = balanceData?.uiAmount || 0;
  } catch (error: any) {
    errorBalance.value = error.toString();
    console.error('Error fetching NOS balance:', error);
  } finally {
    loadingBalance.value = false;
  }
};

// Refresh all token balances
const refreshAllBalances = async () => {
  if (!publicKey.value || !nosana.value) return;
  
  try {
    const [nosBal, solBal, usdcBal, usdtBal] = await Promise.all([
      nosana.value.solana.getNosBalance(),
      nosana.value.solana.getSolBalance(),
      nosana.value.solana.getUsdcBalance(),
      nosana.value.solana.getUsdtBalance()
    ]);

    userBalances.value = {
      nos: nosBal?.uiAmount ?? 0,
      sol: solBal / 1e9,
      usdc: usdcBal?.uiAmount ?? 0,
      usdt: usdtBal?.uiAmount ?? 0
    };
    await refreshBalance();
  } catch (error) {
    console.error('Failed to refresh balances', error);
  }
};

// Watch for wallet connection changes
watch([publicKey, nosana], async () => {
  if (publicKey.value && nosana.value) {
    await refreshAllBalances();
  }
}, { immediate: true });

// Cleanup on component unmount
onBeforeUnmount(() => {
  // Clean up repost data when leaving the page
  if (route.query.repostId) {
    cleanupLocalStorage(route.query.repostId as string);
  }
});

// Add a watch for navTab
watch(navTab, async (newValue) => {
  if (newValue === 'builder' && !selectedTemplate.value) {
    // Create a custom template for the current job definition
    selectedTemplate.value = {
      name: 'Custom',
      description: 'Custom configuration',
      jobDefinition: JSON.parse(JSON.stringify(jobDefinition.value))
    };
    
    // If a market was previously selected, reselect it to ensure proper UI update
    if (selectedMarket.value) {
      const currentMarket = selectedMarket.value;
      selectedMarket.value = null;
      await nextTick();
      selectedMarket.value = currentMarket;
    }
  }
});

watch(() => showSwapModal.value, (newValue) => {
  if (newValue === true) {
    // Force a small delay before refreshing balances
    setTimeout(async () => {
      // Refresh balances before showing the modal
      await refreshAllBalances();
    }, 50);
  }
});

// Add this function to the script section
const openSwapModal = () => {
  // Make sure balances are refreshed before opening the modal
  refreshAllBalances();
  // Set showSwapModal to true
  showSwapModal.value = true;
};
</script>
<style lang="scss" scoped>
.template-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
  position: relative;
  border: 1px solid transparent;

  &.selected-card {
    border: 1px solid $secondary;
  }

  &:hover {
    cursor: pointer;
    border: 1px solid $secondary;
  }
}

.github-stars {
  display: inline-flex;
  align-items: center;
  color: $grey;
  font-size: 0.875rem;
  
  .github-icon {
    width: 18px;
    height: 18px;
    margin-right: 4px;
    vertical-align: middle;
    opacity: 0.7;
  }
}

html.dark-mode .github-icon {
  filter: invert(1);
}

.star-placeholder {
  height: 19px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.header-title {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;

  h2 {
    line-height: 1.2;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }
}

.header-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
  justify-content: center;
  min-height: 56px;
}

.template-description {
  width: 100%;

  p {
    margin: 0;
    overflow-wrap: break-word;
    word-wrap: break-word;
  }
}

.template-icon {
  width: 34px;
  height: 34px;
  border-radius: 100%;
  padding: 0;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: transparent;

  img {
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
}

.dark-mode .template-icon {
  background-color: $black-bis !important;
  border-color: $grey-darker;
}

.new-badge {
  position: absolute;
  top: -0.35rem;
  left: -0.55rem;
  background: black;
  color: white;
  padding: 0.15rem 0.5rem;
  border-radius: 0.75rem;
  font-size: 0.65rem;
  font-weight: bold;
  text-transform: uppercase;
  z-index: 1;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  width: fit-content;
  height: fit-content;
  letter-spacing: 0.02em;
}

.green-checkbox {
  width: 18px;
  height: 18px;
  margin-right: 8px;
  border: 1px solid #ddd;
  border-radius: 3px;
  -webkit-appearance: none;
  appearance: none;
  
  &:checked {
    accent-color: $secondary;
    background-color: $secondary;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24'%3E%3Cpath fill='white' d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z'/%3E%3C/svg%3E");
    background-position: center;
    background-repeat: no-repeat;
    background-size: 100%;
    -webkit-appearance: none;
    appearance: none;
    border-radius: 3px;
    border: none;
  }
}

.template-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;

  .tag {
    font-size: 0.75rem;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-weight: 500;
    background-color: rgba($grey, 0.1);
    color: $grey-dark;
  }
}

.dark-mode {
  .template-tags {
    .tag {
      color: white;
    }
  }
}

.category-filters {
  .checkbox {
    cursor: pointer;
    user-select: none;

    &:hover {
      color: $primary;
    }
  }
  
  .select::after {
    border-color: #888 !important;
  }
}

.nav-tabs-item {
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
  color: $grey;
  cursor: pointer;
  border: none;
  border-bottom: 0px;
  
  &.is-active {
    color: var(--text-color, $black);
    border: none;
    border-bottom: 1px solid var(--tab-bottom-color, white);
    margin-bottom: -1px;
  }
  
  &:hover {
    background-color: $white-ter;
  }
}

.summary {
  position: sticky;
  top: 20px;
  width: 100%;
  padding-top: 0;
  padding-left: 1rem;
  padding-right: 1rem;
  padding-bottom: 1rem;
  z-index: 10;
  margin-top: 0;
}

.h-100, .full-height {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.full-height-editor {
  height: 100%;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.template-info {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
}

.markdown-content {
  flex: 1 1 auto;
  overflow-y: visible;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.builder-columns {
  min-height: 300px;
  height: auto;
}

:deep(.jse) {
  height: 100% !important;
}

.dark-mode {
  .box {
    border-color: $grey-darker !important;
  }
  
  .nav-tabs-item {
    border-color: $grey-darker;
    color: $grey-light;
    
    &.is-active {
      --text-color: $white;
      --tab-bottom-color: $black;
      border-color: $grey-darker;
    }
    
    &:hover {
      background-color: $black-ter;
    }
  }
  
  .tag {
    color: $white !important;
  }
}

/* Responsive styles */
@media screen and (max-width: 768px) {
  .category-filters {
    flex-direction: column;
    width: 100%;
    
    .field.ml-4 {
      margin-left: 0 !important;
      margin-top: 0.75rem;
      width: 100%;
    }
    
    .field {
      width: 100%;
    }
  }
  
  .summary {
    position: static;
    margin-top: 0;
    padding-top: 0;
  }
  
  .header-content {
    gap: 0.5rem;
  }

  .template-icon {
    padding: 5px;
  }

  .header-title h2 {
    font-size: 1.25rem !important;
  }
}

@media screen and (max-width: 480px) {
  .header-content {
    gap: 0.25rem;
  }

  .template-icon {
    width: 30px;
    height: 30px;
    padding: 4px;
  }
}

/* Advanced GPU Selection Styles */
.slider-container {
  position: relative;
  padding: 0 1rem;
  
  .range-slider {
    position: relative;
    width: 100%;
    height: 6px;
    background: #ddd;
    border-radius: 3px;
    margin: 14px 0;
    
    &__range {
      -webkit-appearance: none;
      appearance: none;
      position: absolute;
      top: -4px;
      left: 0;
      width: 100%;
      height: 14px;
      margin: 0;
      background: transparent;
      z-index: 3;
      
      &::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: white;
        cursor: pointer;
        border: 3px solid var(--primary-color, #2A2A2A);
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      
      &::-moz-range-thumb {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: white;
        cursor: pointer;
        border: 3px solid var(--primary-color, #2A2A2A);
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      
      &:focus {
        outline: none;
      }
    }
    
    &__fill {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background: #2A2A2A;
      border-radius: 3px;
      pointer-events: none;
    }
  }
}

.gpu-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.gpu-box {
  position: relative;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 1rem;

  &:hover {
    background: #f5f5f5;
  }

  &.is-selected {
    background: #2A2A2A;
    border-color: #2A2A2A;

    .gpu-box__title,
    .gpu-box__price {
      color: $secondary;
    }

    .gpu-box__specs-row span {
      color: #A0A0A0;
    }

    .gpu-box__selection-indicator {
      border-color: white;
      background: white;

      &::after {
        background: $secondary;
      }
    }
  }

  &__content {
    flex: 1;
  }

  &__main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  &__title {
    font-weight: 600;
    color: black;
    display: flex;
    align-items: center;
  }

  .gpu-logo {
    width: 20px;
    height: 20px;
    margin-right: 8px;
    vertical-align: middle;
  }

  &__price {
    font-size: 1.1rem;
    font-weight: 600;
    color: black;
  }

  &__specs {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  &__specs-row {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;

    span {
      color: #666666;
    }
  }

  &__selection-indicator {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 1px solid #ddd;
    transition: all 0.2s ease;
    flex-shrink: 0;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: transparent;
      transition: all 0.2s ease;
    }
  }
}

.dark-mode {
  .slider-container .range-slider {
    background: var(--grey-darker, #333);
  }
  
  .gpu-box {
    background: var(--black-bis, #121212);
    border-color: var(--grey-darker, #333);

    &:hover {
      background: lighten(#121212, 2%);
    }

    &.is-selected {
      background: #2A2A2A;
      border-color: #2A2A2A;
    }

    &__title, &__price {
      color: white;
    }
  }
}

.input-with-unit {
  // position: relative; // Remove relative positioning
  display: flex;
  align-items: center;
  width: 100%;

  .input {
    // padding-right: 78px; // Remove fixed padding
    flex-grow: 1; /* Allow input to grow */
    min-width: 50px; /* Prevent input from becoming too small */
    width: 100%;
    font-size: 1rem;
  }

  .unit {
    // position: absolute;
    // right: 47px;
    margin-left: 0.5rem; /* Add space after input */
    color: #666;
    font-size: 0.875rem;
    white-space: nowrap;
  }

  .max-value {
    // position: absolute;
    // right: 5px;
    margin-left: 0.25rem; /* Add space after unit */
    color: #666;
    font-size: 0.875rem;
    white-space: nowrap;
  }
}

.advanced-gpu-selection {
  width: 100%;
}

.advanced-gpu-selection .label {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  
  .has-text-grey {
    font-weight: normal;
  }
}

.flex-wrap {
  flex-wrap: wrap;
}

/* GPU list transitions */
.gpu-list-transition-enter-active,
.gpu-list-transition-leave-active {
  transition: all 0.3s ease;
}
.gpu-list-transition-enter-from,
.gpu-list-transition-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
.gpu-list-transition-move {
  transition: transform 0.3s ease;
}

@media screen and (max-width: 1407px) { // Below fullhd (1408px)
  .summary {
    position: static;
    top: auto;
    margin-top: 1.5rem;
    padding-left: 0;
    padding-right: 0;
  }
}

/* Custom breakpoint for 3 columns */
@media screen and (min-width: 1600px) {
  .columns.is-multiline > .column.is-6-fullhd {
    flex: none;
    width: calc(100% / 3);
  }
}

/* Adjust column padding on mobile */
@media screen and (max-width: 768px) {
  .columns.is-multiline > .column.is-9-fullhd,
  .columns.is-multiline > .column.is-3-fullhd {
    padding-left: 0;
    padding-right: 0;
  }

  /* Reduce padding inside the main content boxes on mobile */
  .column.is-9-fullhd > .box,
  .column.is-3-fullhd > .summary > .box {
    padding-left: 0.5rem;
    padding-right: 0.1rem;
  }

  /* Make TopBar more compact on mobile */
  .topbar {
    padding-left: 0.5rem !important;
    padding-right: 0.5rem !important;
  }

  /* Target any buttons or nav items in the TopBar */
  .topbar .button,
  .topbar .navbar-burger {
    margin: 0;
    padding: 0.5rem;
  }
}

/* Stack GPU specs vertically on mobile */
.gpu-box__specs {
  gap: 0.5rem; /* Adjust gap between rows */
}
.gpu-box__specs-row {
  /* flex-direction: column; */ /* Revert stacking */
  /* gap: 0.1rem; */
  /* align-items: flex-start; */
  flex-wrap: wrap; /* Allow items to wrap */
  gap: 0.25rem 0.5rem; /* Adjust vertical and horizontal gap */
}

/* Further adjust input unit/max-value on mobile */
.input-with-unit .unit,
.input-with-unit .max-value {
  font-size: 0.7rem; /* Reduce font size */
  margin-left: 0.2rem; /* Reduce margin */
}
.input-with-unit .unit { 
  margin-left: 0.3rem; /* Keep slightly more margin for unit */
}

/* Allow input to shrink more on mobile */
.input-with-unit .input {
  min-width: 0; /* Allow shrinking below default */
  flex-shrink: 1; /* Ensure input shrinks */
}

/* Adjust slider/input column widths on mobile */
.field > .columns.is-mobile > .column.is-9 {
  width: 60%; /* Equivalent to is-8 */
}
.field > .columns.is-mobile > .column.is-3 {
  width: 33.3333%; /* Equivalent to is-4 */
}
</style> 