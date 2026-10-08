import type { JobDefinition } from "@nosana/kit";
import type { Template } from "./useTemplates";
import type { Requirements } from "./useNodeRequirements";
import { useLocalStorage } from "@vueuse/core";

export interface CreateDeployDraft {
  selectedMarketAddress: string | null;
  selectedTemplate: Template | null;
  jobDefinition: JobDefinition | null;
  deploymentName: string;
  replicas: number;
  timeout: number;
  strategy: string;
  schedule: string;
  sshPublicKeys: string[];
  // Optional: drafts saved before the requirements card existed lack it.
  advancedRequirements?: Requirements;
  timestamp: number;
}

const DRAFT_MAX_AGE_MS = 60 * 60 * 1000;

export function useCreateDeployDraft() {
  const draft = useLocalStorage<CreateDeployDraft | null>(
    "createDeployDraft",
    null,
    {
      serializer: {
        read: (value: string) => {
          try {
            return JSON.parse(value);
          } catch {
            return null;
          }
        },
        write: (value: CreateDeployDraft | null) => JSON.stringify(value),
      },
    },
  );

  const save = (partial: Omit<CreateDeployDraft, "timestamp">) => {
    try {
      draft.value = { ...partial, timestamp: Date.now() };
    } catch (error) {
      console.error("Error saving create-deploy draft:", error);
    }
  };

  // A draft is kept for one trip through signing in: reading it clears it,
  // and one older than an hour is dropped, so a later visit to the create
  // page starts fresh instead of reopening an old template.
  const take = (): CreateDeployDraft | null => {
    const saved = draft.value;
    clear();
    return saved && Date.now() - saved.timestamp < DRAFT_MAX_AGE_MS
      ? saved
      : null;
  };

  const clear = () => {
    try {
      draft.value = null;
    } catch (error) {
      console.error("Error clearing create-deploy draft:", error);
    }
  };

  return { save, take, clear };
}
