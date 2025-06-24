/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_NODE_ENV: string
  readonly VITE_BACKEND_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Export a consistent API URL helper
export const getApiBaseUrl = (): string => {
  return import.meta.env.VITE_API_URL || 
         import.meta.env.VITE_BACKEND_URL || 
         'http://localhost:3001';
};