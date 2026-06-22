import type { JobDefinition } from "@nosana/kit";
import type { Template } from "./useTemplates";
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
  gpuTypeCheckbox: string[];
  activeFilter: string;
  timestamp: number;
}

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

  const load = (): CreateDeployDraft | null => draft.value;

  const clear = () => {
    try {
      draft.value = null;
    } catch (error) {
      console.error("Error clearing create-deploy draft:", error);
    }
  };

  return { save, load, clear };
}
