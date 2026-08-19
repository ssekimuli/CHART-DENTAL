'use client';

import { useEffect, useState } from 'react';
import type { ClientConfigData } from '@/lib/client-config-api';
import {
  fetchClientConfig,
  clearClientConfigCache,
} from '@/lib/client-config-api';

interface UseClientConfigReturn {
  config: ClientConfigData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and use client configuration
 * Automatically fetches from API on mount
 *
 * Usage:
 * const { config, loading, error } = useClientConfig();
 *
 * if (loading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 *
 * return <h1>{config?.appName}</h1>;
 */
export function useClientConfig(): UseClientConfigReturn {
  const [config, setConfig] = useState<ClientConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadConfig = async () => {
      try {
        setLoading(true);
        setError(null);
        const configData = await fetchClientConfig();
        if (mounted) {
          setConfig(configData);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error ? err : new Error('Failed to load config')
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadConfig();

    return () => {
      mounted = false;
    };
  }, []);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      clearClientConfigCache();
      const configData = await fetchClientConfig();
      setConfig(configData);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to load config')
      );
    } finally {
      setLoading(false);
    }
  };

  return { config, loading, error, refetch };
}
