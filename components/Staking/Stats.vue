<template>
  <div>
    <div class="columns is-multiline">
      <div class="column is-6">
        <div class="box">
          <label class="label mb-1">USD value staked</label>
          <div class="is-size-1 has-text-black">
            <CustomCountUp v-if="!loading" :end-val="1000000">
              <template #prefix>
                <span>$</span>
              </template>
            </CustomCountUp>
            <span v-else-if="loading">....</span>
          </div>
        </div>
      </div>
      <div class="column is-6">
        <div class="box">
          <label class="label mb-1">NOS Stakers</label>
          <div class="is-size-1 has-text-black">
            <CustomCountUp :end-val="10000">
            </CustomCountUp>
          </div>
        </div>
      </div>
      <div class="column is-6">
        <div class="box">
          <label class="label mb-1">NOS Staked</label>
          <div class="is-size-1 has-text-black">
            <CustomCountUp :end-val="10000">
            </CustomCountUp>
          </div>
        </div>
      </div>
      <div class="column is-6">
        <div class="box">
          <label class="label mb-1">% total supply staked</label>
          <div class="is-size-1 has-text-black">
            <CustomCountUp :end-val="38" :decimal-places="2">
              <template #suffix>
                <span>%</span>
              </template>
            </CustomCountUp>
          </div>
        </div>
      </div>

      <div class="column is-12">
        <div class="box">
          <div class="is-flex">
            <h2 class="is-size-4 mb-3">MOMENTUM</h2>
            <div class="is-small ml-2 select-filter">
              <select class="has-radius py-1 px-2 pr-4 is-size-7 has-background-white-ter">
                <option>24h</option>
                <option>7d</option>
                <option>30d</option>
              </select>
            </div>
          </div>
          <div class="columns">
            <div class="column is-4">
              <label class="label">Staked Tokens Trend</label>
              <div class="is-size-2 has-text-black is-flex">
                <CustomCountUp :end-val="50.12" :decimal-places="2">
                  <template #suffix>
                    <span>%</span>
                  </template>
                </CustomCountUp>
                <img class="ml-2" width="15" src="@/assets/img/icons/red-arrow.svg">
              </div>
            </div>
            <div class="column is-4">
              <label class="label">Trading Volume Trend</label>
              <div class="is-size-2 has-text-black is-flex">
                <CustomCountUp :end-val="33.33" :decimal-places="2">
                  <template #suffix>
                    <span>%</span>
                  </template>
                </CustomCountUp>
                <img class="ml-2" width="15" src="@/assets/img/icons/green-arrow.svg">
              </div>
            </div>
            <div class="column is-4">
              <label class="label">Page Views Trend</label>
              <div class="is-size-2 has-text-black is-flex">
                <CustomCountUp :end-val="9.12" :decimal-places="2">
                  <template #suffix>
                    <span>%</span>
                  </template>
                </CustomCountUp>
                <img class="ml-2" width="15" src="@/assets/img/icons/green-arrow.svg">
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="column is-12">
        <div class="box">
          <div class="is-flex">
            <h2 class="is-size-4 mb-3">REWARD</h2>
            <div class="is-small ml-2 select-filter">
              <select class="has-radius py-1 px-2 pr-4 is-size-7 has-background-white-ter">
                <option>24h</option>
                <option>7d</option>
                <option>30d</option>
              </select>
            </div>
          </div>
          <div class="columns">
            <div class="column is-4">
              <label class="label">Reward rate</label>
              <div class="is-size-2 has-text-black">
                <CustomCountUp :end-val="100">
                  <template #suffix>
                    <span>%</span>
                  </template>
                </CustomCountUp>
                <span class="label is-size-7 is-flex" style="margin-top: -5px;">
                  <CustomCountUp :end-val="0.42" :decimal-places="2">
                    <template #prefix>
                      <span>+</span>
                    </template>
                    <template #suffix>
                      <span>%</span>
                    </template>
                  </CustomCountUp>
                  <img class="ml-1" src="@/assets/img/icons/green-arrow.svg">
                </span>
              </div>
            </div>
            <div class="column is-4">
              <label class="label">Real Reward rate</label>
              <div class="is-size-2 has-text-black">
                <CustomCountUp :end-val="100">
                  <template #suffix>
                    <span>%</span>
                  </template>
                </CustomCountUp>
                <span class="label is-size-7 is-flex" style="margin-top: -5px;">
                  <CustomCountUp :end-val="0.42" :decimal-places="2">
                    <template #prefix>
                      <span>+</span>
                    </template>
                    <template #suffix>
                      <span>%</span>
                    </template>
                  </CustomCountUp>
                  <img class="ml-1" src="@/assets/img/icons/green-arrow.svg">
                </span>
              </div>
            </div>
            <div class="column is-4">
              <label class="label">Rewards Per Year</label>
              <div class="is-size-2 has-text-black">
                <CustomCountUp :end-val="100">
                  <template #prefix>
                    <span>$</span>
                  </template>
                </CustomCountUp>
                <span class="label is-size-7 is-flex" style="margin-top: -5px;">
                  <CustomCountUp :end-val="-0.42" :decimal-places="2">
                    <template #suffix>
                      <span>%</span>
                    </template>
                  </CustomCountUp>
                  <img class="ml-1" src="@/assets/img/icons/red-arrow.svg">
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="column is-12">
        <div class="box">
          <div class="is-flex">
            <h2 class="is-size-4 mb-3">GENERAL</h2>
            <div class="is-small ml-2 select-filter">
              <select class="has-radius py-1 px-2 pr-4 is-size-7 has-background-white-ter">
                <option>24h</option>
                <option>7d</option>
                <option>30d</option>
              </select>
            </div>
          </div>
          <div class="columns">
            <div class="column is-4">
              <label class="label">Price</label>
              <div class="is-size-2 has-text-black">
                <CustomCountUp :end-val="100">
                  <template #prefix>
                    <span>$</span>
                  </template>
                </CustomCountUp>
                <span class="label is-size-7 is-flex" style="margin-top: -5px;">
                  <CustomCountUp :end-val="0.42" :decimal-places="2">
                    <template #prefix>
                      <span>+</span>
                    </template>
                    <template #suffix>
                      <span>%</span>
                    </template>
                  </CustomCountUp>
                  <img class="ml-1" src="@/assets/img/icons/green-arrow.svg">
                </span>
              </div>
            </div>
            <div class="column is-4">
              <label class="label">Market Cap</label>
              <div class="is-size-2 has-text-black">
                <CustomCountUp :end-val="100">
                  <template #prefix>
                    <span>$</span>
                  </template>
                </CustomCountUp>
                <span class="label is-size-7 is-flex" style="margin-top: -5px;">
                  <CustomCountUp :end-val="0.42" :decimal-places="2">
                    <template #prefix>
                      <span>+</span>
                    </template>
                    <template #suffix>
                      <span>%</span>
                    </template>
                  </CustomCountUp>
                  <img class="ml-1" src="@/assets/img/icons/green-arrow.svg">
                </span>
              </div>
            </div>
            <div class="column is-4">
              <label class="label">Daily Volume</label>
              <div class="is-size-2 has-text-black">
                <CustomCountUp :end-val="100">
                  <template #prefix>
                    <span>$</span>
                  </template>
                </CustomCountUp>
                <span class="label is-size-7 is-flex" style="margin-top: -5px;">
                  <CustomCountUp :end-val="0.42" :decimal-places="2">
                    <template #prefix>
                      <span>+</span>
                    </template>
                    <template #suffix>
                      <span>%</span>
                    </template>
                  </CustomCountUp>
                  <img class="ml-1" src="@/assets/img/icons/green-arrow.svg">
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
const loading: Ref<Boolean> = ref(false);
</script>
<style scoped lang="scss">
.select-filter {
  position: relative;

  &:after {
    content: url('@/assets/img/icons/arrow-down.svg');
    position: absolute;
    top: -1px;
    right: 2px;
    display: block;
    width: 10px;
    pointer-events: none;
    height: 10px;
  }

  select {
    appearance: none;
    border: none;
  }
}
</style>