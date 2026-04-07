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
  description?: string;
  jobDefinition: JobDefinition;
}

export type Template = {
  id: number | string;
  name: string;
  description?: string;
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

type GroupedTemplatesResponse = Record<string, any[]>
type TemplatesResponse =
  | Template[]
  | { data?: Template[] }
  | GroupedTemplatesResponse
  | null
  | undefined

const buildGroupedTemplate = (group: any[]): Template[] => {
  const parentTemplate = group.find((template) => !template?.is_variant_template) ?? group[0]

  if (!parentTemplate?.variants?.length) {
    return parentTemplate ? [parentTemplate] : []
  }

  const templatesById = Object.fromEntries(group.map((template) => [template.id, template]))

  return [{
    ...parentTemplate,
    variants: parentTemplate.variants
      .map((variant: any) => {
        const variantTemplate = templatesById[`${parentTemplate.id}-${variant.id}`]

        if (!variantTemplate?.jobDefinition) {
          return null
        }

        return {
          id: variantTemplate.id,
          variant_id: variant.id,
          name: variant.name,
          description: variant.description,
          jobDefinition: variantTemplate.jobDefinition,
        }
      })
      .filter((variant: TemplateVariant | null): variant is TemplateVariant => Boolean(variant)),
  }]
}

const normalizeTemplates = (value: TemplatesResponse, grouped = false): Template[] => {
  if (Array.isArray(value)) {
    return value
  }

  if (Array.isArray(value?.data)) {
    return value.data
  }

  if (grouped && value) {
    return Object.values(value).flatMap(buildGroupedTemplate)
  }

  return []
}

// Keep original templates endpoint for backward compatibility
const { data: rawTemplates, pending: loadingTemplates } = useAPI('/api/jobs/templates', {
  immediate: true
});

// New grouped templates endpoint
const { data: rawGroupedTemplates, pending: loadingGroupedTemplates } = useAPI('/api/jobs/templates/grouped', {
  immediate: true
});

const templates = computed(() => normalizeTemplates(rawTemplates.value))
const groupedTemplates = computed(() => normalizeTemplates(rawGroupedTemplates.value, true))

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
