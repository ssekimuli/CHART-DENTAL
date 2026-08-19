'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ClientConfigData } from '@/lib/client-config-api';
import {
  fetchClientConfig,
  clearClientConfigCache,
} from '@/lib/client-config-api';

interface ClientConfigContextType {
  config: ClientConfigData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const ClientConfigContext = createContext<ClientConfigContextType | undefined>(
  undefined
);

export function ClientConfigProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, setConfig] = useState<ClientConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        setError(null);
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

    loadConfig();
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

  return (
    <ClientConfigContext.Provider value={{ config, loading, error, refetch }}>
      {children}
    </ClientConfigContext.Provider>
  );
}

/**
 * Hook to access client configuration anywhere in the app
 *
 * Usage:
 * const { config, loading } = useClientConfigContext();
 *
 * if (loading) return <div>Loading...</div>;
 * return <h1>{config?.appName}</h1>;
 */
export function useClientConfigContext(): ClientConfigContextType {
  const context = useContext(ClientConfigContext);
  if (context === undefined) {
    throw new Error(
      'useClientConfigContext must be used within ClientConfigProvider'
    );
  }
  return context;
}
