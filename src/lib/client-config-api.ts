/**
 * Fetch client configuration from API
 * This allows dynamic client configuration without redeployment
 */

export interface ClientConfigData {
  id: string;
  name: string;
  displayName: string;
  appName: string;
  backendUrl: string;
  supportEmail?: string;
  supportPhone?: string;
  theme?: {
    primaryColor?: string;
    brandColor?: string;
  };
  logo?: string;
  favicon?: string;
  features?: {
    desktop?: boolean;
    pwa?: boolean;
    offlineSupport?: boolean;
  };
}

let cachedConfig: ClientConfigData | null = null;
let configPromise: Promise<ClientConfigData> | null = null;

/**
 * Fetch client configuration from backend API
 * Endpoint: GET {backendUrl}/client-config
 *
 * Response example:
 * {
 *   "id": "client-a",
 *   "name": "Dentist A Practice",
 *   "displayName": "Dentist A",
 *   "appName": "DentiChair - Dentist A",
 *   "backendUrl": "https://api-a.example.com/api",
 *   "supportEmail": "support@dentist-a.com",
 *   "supportPhone": "+1-555-0100",
 *   "theme": {
 *     "primaryColor": "#0070f3"
 *   }
 * }
 */
export async function fetchClientConfig(): Promise<ClientConfigData> {
  // Return cached config if available
  if (cachedConfig) {
    return cachedConfig;
  }

  // Return existing promise to avoid duplicate requests
  if (configPromise) {
    return configPromise;
  }

  configPromise = (async () => {
    try {
      // Get backend URL from environment or default
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        'https://api.example.com/api';

      console.log(`📥 Fetching client config from: ${backendUrl}/client-config`);

      const response = await fetch(`${backendUrl}/client-config`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Include credentials if needed for authentication
          ...(typeof window !== 'undefined' && {
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
          }),
        },
        // Cache the response for 5 minutes
        cache: 'no-store',
      });

      if (!response.ok) {
        console.warn(
          `⚠️ Failed to fetch client config (${response.status}), using defaults`
        );
        return getDefaultConfig();
      }

      const config = await response.json();
      cachedConfig = config;
      return config;
    } catch (error) {
      console.error('❌ Error fetching client config:', error);
      return getDefaultConfig();
    }
  })();

  return configPromise;
}

/**
 * Get default client configuration from environment variables
 * Fallback when API is unavailable
 */
function getDefaultConfig(): ClientConfigData {
  return {
    id: process.env.NEXT_PUBLIC_CLIENT_ID || 'default',
    name: process.env.NEXT_PUBLIC_CLIENT_NAME || 'DentiChair',
    displayName: process.env.NEXT_PUBLIC_CLIENT_DISPLAY_NAME || 'DentiChair',
    appName: process.env.NEXT_PUBLIC_APP_NAME || 'DentiChair',
    backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.example.com/api',
    supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
    supportPhone: process.env.NEXT_PUBLIC_SUPPORT_PHONE,
    theme: {
      primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#0070f3',
      brandColor: process.env.NEXT_PUBLIC_BRAND_COLOR || '#0070f3',
    },
    features: {
      desktop: process.env.NEXT_PUBLIC_DESKTOP_FEATURES_ENABLED !== 'false',
      pwa: process.env.NEXT_PUBLIC_PWA_ENABLED !== 'false',
      offlineSupport: process.env.NEXT_PUBLIC_OFFLINE_SUPPORT !== 'false',
    },
  };
}

/**
 * Clear cached config (useful for testing or after login)
 */
export function clearClientConfigCache() {
  cachedConfig = null;
  configPromise = null;
}

/**
 * Refresh client config from API
 */
export function refreshClientConfig() {
  clearClientConfigCache();
  return fetchClientConfig();
}
