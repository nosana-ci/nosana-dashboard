import type { Market, JobDefinition } from "@nosana/kit";
import type { Template } from "./useTemplates";
import { useLocalStorage } from "@vueuse/core";

// Deploy page state interface
export interface DeployPageState {
  selectedMarket: Market | null;
  selectedTemplate: Template | null;
  jobDefinition: JobDefinition;
  hours: number;
  gpuTab: 'simple' | 'advanced';
  gpuTypeCheckbox: string[];
  activeFilter: string;
  timestamp: number;
  source: 'user' | 'redeploy';
}

// Default state factory
const createDefaultState = (): DeployPageState => ({
  selectedMarket: null,
  selectedTemplate: null,
  jobDefinition: {
    type: "container",
    version: "0.1",
    ops: [
      {
        id: "default",
        type: "container/run",
        args: {
          image: "ubuntu",
          gpu: true,
          cmd: ["echo", "hello world"],
          expose: 80
        }
      }
    ],
    meta: {
      trigger: "dashboard",
      system_requirements: {
        required_vram: 1
      }
    }
  },
  hours: 1,
  gpuTab: 'simple',
  gpuTypeCheckbox: ["PREMIUM"],
  activeFilter: "PREMIUM",
  timestamp: Date.now(),
  source: 'user'
});


export function useDeployPageState() {
  
  // Persistent storage using VueUse
  const storedState = useLocalStorage<DeployPageState | null>('deployPageState', null, {
    serializer: {
      read: (value: string) => {
        try {
          return JSON.parse(value);
        } catch {
          return null;
        }
      },
      write: (value: DeployPageState | null) => JSON.stringify(value)
    }
  });

  // Check if stored state exists
  const hasValidStoredState = computed(() => {
    return storedState.value !== null;
  });

  // Save current state to localStorage
  const saveState = (state: Partial<DeployPageState>, source: 'user' | 'redeploy' = 'user') => {
    try {
      // Only use default state if no state exists at all
      const currentState = storedState.value ? storedState.value : createDefaultState();
      const newState: DeployPageState = {
        ...currentState,
        ...state,
        timestamp: Date.now(),
        source
      };
      
      storedState.value = newState;
    } catch (error) {
      console.error('Error saving deploy state:', error);
    }
  };

  // Load state from localStorage
  const loadState = (): DeployPageState | null => {
    try {
      return storedState.value;
    } catch (error) {
      console.error('Error loading deploy state:', error);
      clearState();
      return null;
    }
  };

  // Clear stored state
  const clearState = () => {
    try {
      storedState.value = null;
    } catch (error) {
      console.error('Error clearing deploy state:', error);
    }
  };

  // Check if state should be restored
  const shouldRestoreState = () => {
    return hasValidStoredState.value;
  };

  // Create a reactive debounced save function
  let saveTimeout: NodeJS.Timeout | null = null;
  const debouncedSave = (state: Partial<DeployPageState>, delay: number = 500) => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    saveTimeout = setTimeout(() => {
      saveState(state, 'user');
    }, delay);
  };

  // Cleanup function for timeouts
  const cleanup = () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
  };

  return {
    // State
    hasValidStoredState,
    
    // Methods
    saveState,
    loadState,
    clearState,
    shouldRestoreState,
    debouncedSave,
    cleanup,
    
    // Utilities
    createDefaultState
  };
}