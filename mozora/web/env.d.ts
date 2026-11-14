/// <reference types="vite/client" />

// Provided by mozora/vite-plugin.mjs: the host's token blocks from assets/style.css.
declare module 'virtual:mozora-host-tokens.css';

interface ImportMetaEnv {
  readonly VITE_MOZORA_ENABLED?: string;
}
