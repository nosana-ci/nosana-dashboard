import type { PartialClientConfig } from "@nosana/kit";

type NosanaApiConfig = NonNullable<PartialClientConfig["api"]>;

export interface NosanaApiConfigInput {
  /** Base URL that fronts every Nosana service in this environment. */
  apiBase?: string;
  apiKey?: string | null;
  /** Send the browser session cookie instead of signing requests. */
  includeCredentials?: boolean;
}

/** The Kit API config for this session, or undefined when Kit's defaults suffice. */
export function buildNosanaApiConfig({
  apiBase,
  apiKey,
  includeCredentials,
}: NosanaApiConfigInput): NosanaApiConfig | undefined {
  if (!apiBase && !apiKey && !includeCredentials) {
    return undefined;
  }

  const config: NosanaApiConfig = {};

  if (apiKey) {
    config.apiKey = apiKey;
  }

  if (apiBase) {
    config.client_manager_url = apiBase;
    config.host_manager_url = apiBase;
    config.deployment_manager_url = apiBase;
  }

  if (includeCredentials) {
    config.include_credentials = true;
  }

  return config;
}
