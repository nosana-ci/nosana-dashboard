export function buildNosanaApiConfig({ apiBase, apiKey, includeCredentials }) {
  if (!apiBase && !apiKey && !includeCredentials) {
    return undefined;
  }

  const config = {};

  if (apiKey) {
    config.apiKey = apiKey;
  }

  if (apiBase) {
    config.backend_url = apiBase;
    config.client_manager_url = apiBase;
  }

  if (includeCredentials) {
    config.include_credentials = true;
  }

  return config;
}