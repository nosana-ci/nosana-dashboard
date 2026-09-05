import type { ApiDeploymentListResult } from "@nosana/api";
import { useWallet } from "@nosana/solana-vue";
import { useToast } from "vue-toastification";
import {
  canArchiveDeployment,
  canDeleteDeployment,
  canStartDeployment,
  canStopDeployment,
} from "~/utils/deploymentStatusActions";

export type ListedDeployment = ApiDeploymentListResult["deployments"][number];
export type BulkActionKey = "start" | "stop" | "archive" | "delete";

// Same eligibility rules as the detail page's actions menu, so a bulk action
// only touches the deployments the single-deployment action would allow.
export const bulkActions: {
  key: BulkActionKey;
  label: string;
  done: string;
  danger: boolean;
  eligible: (status?: string | null) => boolean;
}[] = [
  {
    key: "start",
    label: "Start",
    done: "Started",
    danger: false,
    eligible: canStartDeployment,
  },
  {
    key: "stop",
    label: "Stop",
    done: "Stopped",
    danger: true,
    eligible: canStopDeployment,
  },
  {
    key: "archive",
    label: "Archive",
    done: "Archived",
    danger: true,
    eligible: canArchiveDeployment,
  },
  {
    key: "delete",
    label: "Delete",
    done: "Deleted",
    danger: true,
    eligible: canDeleteDeployment,
  },
];

// Module-level so the deployments list (checkboxes) and the table toolbar
// (Actions menu) share one selection. The list owns `listed`: it replaces it
// on every load and empties it on unmount, and selection never outlives the
// rows it was made on.
const listed = ref<ListedDeployment[]>([]);
const selectedIds = ref(new Set<string>());
const bulkRunning = ref<BulkActionKey | null>(null);
let afterBulk: (() => Promise<void>) | null = null;

export function useDeploymentSelection() {
  const toast = useToast();
  const { connected } = useWallet();
  const { isAuthenticated } = useSuperTokens();

  // Wallet users archive; non-wallet (credit / Google-email) users delete.
  // The two are mutually exclusive so the menu never shows both.
  const isWalletMode = computed(
    () => connected.value && !isAuthenticated.value,
  );
  const availableBulkActions = computed(() =>
    bulkActions.filter((action) => {
      if (action.key === "archive") return isWalletMode.value;
      if (action.key === "delete") return !isWalletMode.value;
      return true;
    }),
  );

  const selectedDeployments = computed(() =>
    listed.value.filter((d) => selectedIds.value.has(d.id)),
  );

  const allSelected = computed(
    () =>
      listed.value.length > 0 &&
      listed.value.every((d) => selectedIds.value.has(d.id)),
  );

  const bulkTargets = computed(
    () =>
      Object.fromEntries(
        bulkActions.map((action) => [
          action.key,
          selectedDeployments.value.filter((d) => action.eligible(d.status)),
        ]),
      ) as Record<BulkActionKey, ListedDeployment[]>,
  );

  const setListed = (deployments: ListedDeployment[]) => {
    listed.value = deployments;
    selectedIds.value.clear();
  };

  // The list registers how to reload itself once a bulk action has run.
  const onAfterBulk = (refresh: (() => Promise<void>) | null) => {
    afterBulk = refresh;
  };

  const toggleOne = (id: string) => {
    if (selectedIds.value.has(id)) selectedIds.value.delete(id);
    else selectedIds.value.add(id);
  };

  const toggleAll = () => {
    if (allSelected.value) {
      selectedIds.value.clear();
      return;
    }
    for (const d of listed.value) selectedIds.value.add(d.id);
  };

  const clearSelection = () => selectedIds.value.clear();

  const runBulkAction = async (key: BulkActionKey) => {
    const action = bulkActions.find((a) => a.key === key)!;
    const targets = bulkTargets.value[key];
    if (!targets.length || bulkRunning.value) return;

    if (
      key === "archive" &&
      !confirm(
        `Archive ${targets.length} deployment${targets.length === 1 ? "" : "s"}? This action cannot be undone.`,
      )
    ) {
      return;
    }

    if (
      key === "delete" &&
      !confirm(
        `Delete ${targets.length} deployment${targets.length === 1 ? "" : "s"}? This permanently removes them and all their data and cannot be undone.`,
      )
    ) {
      return;
    }

    bulkRunning.value = key;
    let succeeded = 0;

    // One at a time keeps each failure attributable to its deployment and
    // avoids a burst of concurrent requests against the deployment manager.
    for (const deployment of targets) {
      try {
        await deployment[key]();
        succeeded++;
      } catch (err: any) {
        console.error(`Bulk ${key} error:`, err);
        toast.error(
          `Failed to ${key} ${deployment.name || deployment.id}: ${
            err?.data?.message || err?.message || err
          }`,
        );
      }
    }

    if (succeeded) {
      toast.success(
        `${action.done} ${succeeded} deployment${succeeded === 1 ? "" : "s"}`,
      );
    }

    // Give the deployment manager a moment to apply the change before
    // re-reading the list (same pause the detail page takes).
    await new Promise((resolve) => setTimeout(resolve, 500));
    await afterBulk?.();
    bulkRunning.value = null;
  };

  return {
    selectedIds,
    selectedDeployments,
    allSelected,
    availableBulkActions,
    bulkTargets,
    bulkRunning,
    setListed,
    onAfterBulk,
    toggleOne,
    toggleAll,
    clearSelection,
    runBulkAction,
  };
}
