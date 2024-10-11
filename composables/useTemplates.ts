import type { JobDefinition } from "@nosana/sdk"
const emptyJobDefinition: JobDefinition = {
  "version": "0.1",
  "type": "container",
  "meta": {
    "trigger": "job-builder"
  },
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

export type Template = {
  id: number | string;
  name: string;
  description: string;
  jobDefinition: JobDefinition;
  category: string;
  icon: string;
  readme: string;
}

const { data: templates, pending: loadingTemplates } = useAPI('/api/jobs/templates');

export const useTemplates = (): {templates: Ref<Template[]>, emptyJobDefinition: JobDefinition, loadingTemplates: Ref<boolean>} => {
  return { templates, emptyJobDefinition, loadingTemplates };
};
