export interface SavedPaymentMethod {
  id: string;
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
  funding: string | null;
  isDefault: boolean;
}

export interface PaymentMethodsResponse {
  methods: SavedPaymentMethod[];
  paymentVerified: boolean;
}

export interface SetupIntentResponse {
  accepted: boolean;
  verificationError: string | null;
  paymentVerified: boolean;
  requiresAction: boolean;
  clientSecret: string | null;
  setupIntentId: string | null;
}

const methods = ref<SavedPaymentMethod[]>([]);
const paymentVerified = ref(false);
const loading = ref(false);
const settingDefaultId = ref<string | null>(null);

let fetchPromise: Promise<void> | null = null;

export function usePaymentMethods() {
  const config = useRuntimeConfig().public;

  const fetchPaymentMethods = async () => {
    if (fetchPromise) return fetchPromise;

    fetchPromise = (async () => {
      loading.value = true;
      try {
        const data = await $fetch<PaymentMethodsResponse>(
          `${config.apiBase}/api/payments/methods`,
          { credentials: "include" },
        );
        methods.value = data.methods.map((method) => ({
          ...method,
          isDefault: method.isDefault ?? false,
        }));
        paymentVerified.value = data.paymentVerified;
      } catch {
        methods.value = [];
        paymentVerified.value = false;
      } finally {
        loading.value = false;
        fetchPromise = null;
      }
    })();

    return fetchPromise;
  };

  const setDefaultPaymentMethod = async (paymentMethodId: string) => {
    settingDefaultId.value = paymentMethodId;
    try {
      const data = await $fetch<PaymentMethodsResponse>(
        `${config.apiBase}/api/payments/methods/${paymentMethodId}/default`,
        {
          method: "PUT",
          credentials: "include",
        },
      );
      methods.value = data.methods.map((method) => ({
        ...method,
        isDefault: method.isDefault ?? false,
      }));
      paymentVerified.value = data.paymentVerified;
    } finally {
      settingDefaultId.value = null;
    }
  };

  return {
    methods,
    paymentVerified,
    loading,
    settingDefaultId,
    fetchPaymentMethods,
    setDefaultPaymentMethod,
  };
}
