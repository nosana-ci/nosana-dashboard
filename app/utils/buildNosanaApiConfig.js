export function buildNosanaApiConfig({
  apiBase,
  apiKey,
  includeCredentials,
  nodeDomain,
}) {
  if (!apiBase && !apiKey && !includeCredentials && !nodeDomain) {
    return undefined;
  }

  const config = {};

  if (apiKey) {
    config.apiKey = apiKey;
  }

  if (apiBase) {
    config.backend_url = apiBase;
    config.client_manager_url = apiBase;
    config.host_manager_url = apiBase;
    config.deployment_manager_url = apiBase;
  }

  if (includeCredentials) {
    config.include_credentials = true;
  }

  if (nodeDomain) {
    config.node_domain = nodeDomain;
  }

  return config;
}
