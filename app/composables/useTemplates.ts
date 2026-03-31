import type { JobDefinition } from "@nosana/kit"

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
const { data: rawTemplates, pending: loadingTemplates } = useAPI('/api/jobs/templates', {
  immediate: true
});

// New grouped templates endpoint
const { data: rawGroupedTemplates, pending: loadingGroupedTemplates } = useAPI('/api/jobs/templates/grouped', {
  immediate: true
});

const normalizeTemplatesResponse = (value: unknown): Template[] => {
  if (Array.isArray(value)) return value as Template[];
  if (!value || typeof value !== "object") return [];

  const record = value as Record<string, unknown>;

  if (Array.isArray(record.templates)) return record.templates as Template[];
  if (Array.isArray(record.items)) return record.items as Template[];

  if (record.data) {
    if (Array.isArray(record.data)) return record.data as Template[];

    if (typeof record.data === "object" && record.data !== null) {
      const nestedData = record.data as Record<string, unknown>;
      if (Array.isArray(nestedData.templates)) return nestedData.templates as Template[];
      if (Array.isArray(nestedData.items)) return nestedData.items as Template[];
    }
  }

  return [];
};

const templates = computed<Template[]>(() => normalizeTemplatesResponse(rawTemplates.value));
const groupedTemplates = computed<Template[]>(() => normalizeTemplatesResponse(rawGroupedTemplates.value));

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
