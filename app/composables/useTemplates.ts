import type { JobDefinition } from "@nosana/sdk"

const emptyJobDefinition: JobDefinition = {
  "version": "0.1",
  "type": "container",
  "ops": [
    {
      "type": "container/run",
      "id": "",
      "args": {
        "image": "",
        "gpu": true
      }
    }
  ]
}

export type TemplateVariant = {
  id: string;
  variant_id: string;
  name: string;
  jobDefinition: JobDefinition;
}

export type Template = {
  id: number | string;
  name: string;
  jobDefinition?: JobDefinition; // Optional for parent templates
  category: string;
  icon: string;
  readme: string;
  // New fields for template variants support
  variants?: TemplateVariant[];
  is_variant_template?: boolean;
  parent_template_id?: string;
  selectedVariant?: TemplateVariant; // For UI state tracking
}

// Keep original templates endpoint for backward compatibility
const { data: templates, pending: loadingTemplates } = useAPI('/api/jobs/templates', {
  immediate: true
});

// New grouped templates endpoint
const { data: groupedTemplates, pending: loadingGroupedTemplates } = useAPI('/api/jobs/templates/grouped', {
  immediate: true
});

export const useTemplates = (): {
  templates: Ref<Template[]>, 
  groupedTemplates: Ref<Template[]>,
  emptyJobDefinition: JobDefinition, 
  loadingTemplates: Ref<boolean>,
  loadingGroupedTemplates: Ref<boolean>
} => {
  return { 
    templates, 
    groupedTemplates,
    emptyJobDefinition, 
    loadingTemplates,
    loadingGroupedTemplates 
  };
};
