'use client';

import { useEffect, useState } from 'react';

export function useDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [appVersion, setAppVersion] = useState<string | null>(null);

  useEffect(() => {
    // Check if running in Tauri desktop app
    const checkDesktop = async () => {
      try {
        // @ts-ignore - Tauri API might not be typed in dev
        if (window.__TAURI__) {
          setIsDesktop(true);
          // Try to get app version
          try {
            const { invoke } = await import('@tauri-apps/api/tauri');
            const version = await invoke('get_app_version');
            setAppVersion(version as string);
          } catch (e) {
            console.log('Could not get app version');
          }
        }
      } catch (e) {
        // Not in desktop app
      }
    };

    checkDesktop();
  }, []);

  return {
    isDesktop,
    appVersion,
    isWeb: !isDesktop,
  };
}

export async function openDesktopFile(extensions: string[] = []) {
  try {
    // @ts-ignore
    if (window.__TAURI__) {
      const { open } = await import('@tauri-apps/api/dialog');
      return await open({
        multiple: false,
        filters: [
          {
            name: 'Files',
            extensions,
          },
        ],
      });
    }
  } catch (error) {
    console.error('Failed to open file dialog:', error);
  }
  return null;
}

export async function openDesktopFolder() {
  try {
    // @ts-ignore
    if (window.__TAURI__) {
      const { open } = await import('@tauri-apps/api/dialog');
      return await open({
        directory: true,
      });
    }
  } catch (error) {
    console.error('Failed to open folder dialog:', error);
  }
  return null;
}
