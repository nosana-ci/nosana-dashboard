<template>
  <span class="card-brand-icon" :title="brand ?? undefined">
    <component :is="icon" v-if="icon" class="card-svg" :aria-label="brand ?? undefined" role="img" />
    <!-- Generic fallback -->
    <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 24" width="38" height="24" role="img" :aria-label="brand ?? undefined">
      <rect width="38" height="24" rx="4" fill="#e8e8e8"/>
      <rect x="3" y="7" width="32" height="4" rx="1" fill="#bbb"/>
      <rect x="3" y="14" width="10" height="3" rx="1" fill="#bbb"/>
      <rect x="15" y="14" width="10" height="3" rx="1" fill="#bbb"/>
    </svg>
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";

import VisaIcon from "@/assets/img/icons/cards/visa.svg?component";
import MastercardIcon from "@/assets/img/icons/cards/mastercard.svg?component";
import AmexIcon from "@/assets/img/icons/cards/american-express.svg?component";
import DiscoverIcon from "@/assets/img/icons/cards/discover.svg?component";
import JcbIcon from "@/assets/img/icons/cards/jcb.svg?component";
import UnionpayIcon from "@/assets/img/icons/cards/unionpay.svg?component";
import MaestroIcon from "@/assets/img/icons/cards/maestro.svg?component";
import DinersIcon from "@/assets/img/icons/cards/diners.svg?component";
import CartesBancairesIcon from "@/assets/img/icons/cards/cartes-bancaires.svg?component";
import DankortIcon from "@/assets/img/icons/cards/dankort.svg?component";
import EloIcon from "@/assets/img/icons/cards/elo.svg?component";
import HipercardIcon from "@/assets/img/icons/cards/hipercard.svg?component";
import UatpIcon from "@/assets/img/icons/cards/uatp.svg?component";
import VpayIcon from "@/assets/img/icons/cards/vpay.svg?component";

const BRAND_MAP: Record<string, unknown> = {
  visa: VisaIcon,
  mastercard: MastercardIcon,
  amex: AmexIcon,
  americanexpress: AmexIcon,
  discover: DiscoverIcon,
  jcb: JcbIcon,
  unionpay: UnionpayIcon,
  maestro: MaestroIcon,
  diners: DinersIcon,
  dinersclub: DinersIcon,
  cartesbancaires: CartesBancairesIcon,
  dankort: DankortIcon,
  elo: EloIcon,
  hipercard: HipercardIcon,
  uatp: UatpIcon,
  vpay: VpayIcon,
};

const props = defineProps<{
  brand: string | null;
}>();

const normalized = computed(() =>
  (props.brand ?? "").toLowerCase().replace(/[\s_-]/g, ""),
);

const icon = computed(() => BRAND_MAP[normalized.value] ?? null);
</script>

<style scoped>
.card-brand-icon {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.card-brand-icon svg,
.card-brand-icon :deep(svg) {
  display: block;
  width: 38px;
  height: 24px;
  border-radius: 3px;
}
</style>
