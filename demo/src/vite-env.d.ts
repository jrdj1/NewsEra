/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WALLETCONNECT_PROJECT_ID: string;
  readonly VITE_PUBLICATION_REGISTRY_ADDRESS: string;
  readonly VITE_VALIDATION_REGISTRY_ADDRESS: string;
  readonly VITE_REPUTATION_SYSTEM_ADDRESS: string;
  readonly VITE_BACKEND_URL: string;
  readonly VITE_PINATA_JWT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
