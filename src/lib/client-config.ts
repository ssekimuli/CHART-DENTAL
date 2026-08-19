/**
 * Client-specific configuration
 * Loaded from environment variables at build time
 */

export interface ClientConfig {
  id: string;
  name: string;
  displayName: string;
  backendUrl: string;
  appName: string;
  supportEmail?: string;
  supportPhone?: string;
  primaryColor?: string;
}

export function getClientConfig(): ClientConfig {
  return {
    id: process.env.NEXT_PUBLIC_CLIENT_ID || 'default',
    name: process.env.NEXT_PUBLIC_CLIENT_NAME || 'DentiChair',
    displayName: process.env.NEXT_PUBLIC_CLIENT_DISPLAY_NAME || 'DentiChair',
    backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.example.com/api',
    appName: process.env.NEXT_PUBLIC_APP_NAME || 'DentiChair',
    supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
    supportPhone: process.env.NEXT_PUBLIC_SUPPORT_PHONE,
    primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#0070f3',
  };
}

/**
 * Get app title for HTML head
 * Used in layout metadata
 */
export function getAppTitle(): string {
  const config = getClientConfig();
  return config.appName || 'DentiChair';
}

/**
 * Get app description
 */
export function getAppDescription(): string {
  return `${getClientConfig().appName} - Professional Dental Practice Management`;
}
