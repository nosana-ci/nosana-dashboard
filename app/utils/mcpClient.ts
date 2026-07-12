import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

let mcpClient: Client | null = null;

/**
 * Initializes and connects the MCP Client using SSE Transport.
 * @param url The SSE Endpoint of the deployed Nosana MCP Server (e.g., https://nosana-mcp.app/sse)
 * @param token Optional Bearer token for authentication
 */
export async function initializeMCPClient(url: string, token?: string): Promise<Client> {
  if (mcpClient) {
    await mcpClient.close();
  }

  // Set up custom headers if a token is provided
  const requestInit = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;

  const transport = new SSEClientTransport(new URL(url), { requestInit });

  const client = new Client(
    { name: 'nosana-dashboard-integration', version: '1.0.0' },
    { capabilities: {} }
  );

  await client.connect(transport);
  mcpClient = client;
  
  return client;
}

/**
 * Returns the active MCP Client instance.
 * Throws an error if not initialized.
 */
export function getMCPClient(): Client {
  if (!mcpClient) {
    throw new Error('MCP Client is not initialized. Please configure the server URL first.');
  }
  return mcpClient;
}

/**
 * Executes a tool on the Nosana MCP Server
 * @param toolName The name of the tool (e.g., 'deployer.post_job')
 * @param args The arguments for the tool
 */
export async function executeMCPTool(toolName: string, args: Record<string, any>) {
  const client = getMCPClient();
  const response = await client.callTool({
    name: toolName,
    arguments: args
  });
  
  // The MCP SDK returns content as an array of TextContent objects
  const rawContent = (response.content as any[])[0].text;
  return JSON.parse(rawContent);
}
