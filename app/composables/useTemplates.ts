import type { JobDefinition } from "@nosana/kit"
import type { QuickStart } from "~/utils/quickStart"

const emptyJobDefinition: JobDefinition = {
  "version": "0.1",
  "type": "container",
  "ops": [
    {
      "type": "container/run",
      "id": "app",
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
  /** Set on a quick-start workload: the registry model it was built from. */
  quickStart?: QuickStart;
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

/**
 * The GPU memory (MB) a job definition asks for, or null when it states none.
 * Templates use `vram_total_mb`, or the legacy `required_vram` in GB.
 */
export const requiredVramMb = (jobDefinition?: JobDefinition | null): number | null => {
  const reqs = (jobDefinition?.meta as { system_requirements?: Record<string, unknown> } | undefined)
    ?.system_requirements
  if (reqs?.vram_total_mb) return Number(reqs.vram_total_mb)
  if (reqs?.required_vram) return Number(reqs.required_vram) * 1024
  return null
}

/** The pipe-separated category string as tags; "Web UI" and friends stay as written. */
export const templateTags = (template: Template): string[] =>
  template.category ? template.category.split('|') : []

/** The docker image of the first op, which is what a tile shows for the template. */
/** Tags that group the catalogue rather than describe a template. */
const GROUPING_TAGS = ['Featured', 'New', 'Official', 'Community']

/** A template's tags without the grouping ones, for its small label. */
export const descriptiveTags = (template: Template): string[] =>
  templateTags(template).filter((tag) => !GROUPING_TAGS.includes(tag))

export const templateDockerImage = (jobDefinition?: JobDefinition | null): string | null => {
  const args = jobDefinition?.ops?.[0]?.args
  return args && 'image' in args && args.image ? args.image : null
}

export const formatVram = (mb: number): string => {
  const gb = mb / 1024
  return `${Number.isInteger(gb) ? gb : gb.toFixed(1)} GB VRAM`
}

const SNIPPET_LENGTH = 220

const readmeParagraphs = (readme: string): string[] =>
  readme
    .replace(/```[\s\S]*?```/g, '\n')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .split(/\n\s*\n/)
    .map((block) =>
      block
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !/^(#|[-*+]\s|\d+\.\s|>|\|)/.test(line))
        .join(' ')
        .replace(/[*_`~]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .filter(Boolean)

/**
 * The first prose paragraph of the README as plain text: headings, lists,
 * code blocks, images and tables are dropped, inline markdown is unwrapped,
 * and a paragraph that merely repeats the description is skipped.
 */
export const templateReadmeSnippet = (template: Template): string | null => {
  const description = template.description?.trim() ?? ''
  const paragraph = readmeParagraphs(template.readme ?? '').find(
    (text) => !description || !text.startsWith(description)
  )
  if (!paragraph) return null
  return paragraph.length > SNIPPET_LENGTH
    ? `${paragraph.slice(0, SNIPPET_LENGTH).trimEnd()}…`
    : paragraph
}

/**
 * The README as shown under a template's lead: without its "# Title" line (the
 * page names the template) and without an opening paragraph that only repeats
 * the lead, whether that lead is the description or the snippet above.
 */
export const templateReadmeBody = (template: Template, lead: string): string => {
  const body = (template.readme ?? '').replace(/^\s*#\s+[^\n]*\n/, '').trim()
  const [first = '', ...rest] = body.split(/\n\s*\n/)
  const lede = lead.replace(/…$/, '').trim()
  const repeatsLead =
    Boolean(lede) && (readmeParagraphs(first)[0] ?? '').startsWith(lede)
  return repeatsLead ? rest.join('\n\n') : body
}

/** A template flattened onto one of its variants, the shape the create flow works with. */
export const withVariant = (template: Template, variant: TemplateVariant): Template => ({
  ...template,
  id: `${template.id}-${variant.variant_id}`,
  name: `${template.name} - ${variant.name}`,
  description: variant.description,
  jobDefinition: variant.jobDefinition,
  selectedVariant: variant,
})

// Keep original templates endpoint for backward compatibility
const { data: rawTemplates, pending: loadingTemplates } = useAPI('/jobs/templates', {
  immediate: true
});

// New grouped templates endpoint
const { data: rawGroupedTemplates, pending: loadingGroupedTemplates } = useAPI('/jobs/templates/grouped', {
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
