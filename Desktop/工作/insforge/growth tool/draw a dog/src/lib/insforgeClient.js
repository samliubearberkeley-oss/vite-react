import { createClient } from "@insforge/sdk";
import { createMockClient } from "./mockInsforge";
import { INSFORGE_CONFIG } from "./config";

// Get configuration from centralized config
const { baseUrl, apiKey } = INSFORGE_CONFIG;

// Check if we have a valid Insforge base URL
const hasValidBaseUrl = baseUrl && 
  baseUrl !== 'https://your-instance.insforge.app' && 
  baseUrl.startsWith('http');

// Create Insforge client (used only for storage operations now)
// Database operations use direct fetch calls with apikey header to bypass JWT expired issue
export const insforge = hasValidBaseUrl
  ? createClient({ 
      baseUrl,
      anonKey: apiKey,
    })
  : createMockClient();

// Log which client is being used (for debugging)
if (import.meta.env.DEV) {
  console.log(
    hasValidBaseUrl 
      ? `✅ Using Insforge backend: ${baseUrl} (Storage via SDK, Database via direct fetch)`
      : `⚠️ Using mock client (set VITE_INSFORGE_BASE_URL in .env to use real backend)`
  );
}

export default insforge;
