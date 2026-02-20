type Option = { label: string; value: string | null };

type Filters = Record<string, Option[] | undefined>;

export const filters: Filters = {
  deployments: [
    { label: "All", value: null },
    { label: "Draft", value: "DRAFT" as string },
    { label: "Running", value: "RUNNING" as string },
    { label: "Stopped", value: "STOPPED" as string },
    { label: "Error", value: "ERROR" as string },
    { label: "Archived", value: "ARCHIVED" as string },
  ],
  jobs: [
    { label: "All", value: null },
    { label: "Completed", value: "2" as string },
    { label: "Running", value: "1" as string },
    { label: "Queued", value: "0" as string },
    { label: "Stopped", value: "3" as string },
  ],
  vaults: undefined
}