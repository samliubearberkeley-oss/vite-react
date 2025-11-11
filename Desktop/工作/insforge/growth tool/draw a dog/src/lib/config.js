/**
 * Centralized configuration for Insforge backend
 * Uses environment variables with fallback to default values
 */
export const INSFORGE_CONFIG = {
  baseUrl: import.meta.env.VITE_INSFORGE_BASE_URL || 'https://pqh4hzpa.us-east.insforge.app',
  apiKey: import.meta.env.VITE_INSFORGE_API_KEY || 'ik_93eb600137227f074aa025378a0f2b7f',
};

// Log configuration in development mode
if (import.meta.env.DEV) {
  console.log('🔧 Insforge Config:', {
    baseUrl: INSFORGE_CONFIG.baseUrl,
    apiKey: INSFORGE_CONFIG.apiKey.substring(0, 10) + '...',
    usingEnvVars: {
      baseUrl: !!import.meta.env.VITE_INSFORGE_BASE_URL,
      apiKey: !!import.meta.env.VITE_INSFORGE_API_KEY,
    }
  });
}

