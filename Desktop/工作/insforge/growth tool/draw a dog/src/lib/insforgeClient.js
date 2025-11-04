import { createClient } from "@insforge/sdk";
import { createMockClient } from "./mockInsforge";

// Use mock if baseUrl is not configured (for local testing)
const baseUrl = import.meta.env.VITE_INSFORGE_BASE_URL;
const apiKey = import.meta.env.VITE_INSFORGE_API_KEY || 'ik_93eb600137227f074aa025378a0f2b7f';

// Check if we have a valid Insforge base URL
const hasValidBaseUrl = baseUrl && 
  baseUrl !== 'https://your-instance.insforge.app' && 
  baseUrl.startsWith('http');

export const insforge = hasValidBaseUrl
  ? createClient({ 
      baseUrl,
      // Try different parameter names for API key
      accessToken: apiKey,
      apiKey: apiKey,
      anonKey: apiKey
    })
  : createMockClient();

// Log which client is being used (for debugging)
if (import.meta.env.DEV) {
  console.log(
    hasValidBaseUrl 
      ? `✅ Using Insforge backend: ${baseUrl}`
      : `⚠️ Using mock client (set VITE_INSFORGE_BASE_URL in .env to use real backend)`
  );
}

export default insforge;
