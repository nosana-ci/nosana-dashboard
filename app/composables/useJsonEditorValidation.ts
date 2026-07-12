import { useToast } from 'vue-toastification';
import type { Ref } from 'vue';

/**
 * Composable for handling JSON editor validation before save operations
 * @param editorRef - Reference to the JsonEditor component
 * @returns Function to check if save is allowed
 */
export function useJsonEditorValidation(editorRef: Ref<{ hasErrors: boolean } | null>) {
  const toast = useToast();

  /**
   * Check if the editor has errors and show toast if it does
   * @param errorMessage - Custom error message to show
   * @returns true if valid (can save), false if has errors (cannot save)
   */
  const canSave = (errorMessage = 'Cannot save: Please fix the errors in the job definition'): boolean => {
    if (editorRef.value?.hasErrors) {
      toast.error(errorMessage);
      return false;
    }
    return true;
  };

  return { canSave };
}

