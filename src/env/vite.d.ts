/// <reference types="vite/client" />

declare const __APP_VERSION__: string
declare const __APP_COMMIT_HASH__: string
declare const __APP_BUILD_TIMESTAMP__: number
declare const __REPO_URL__: string
declare const __APP_DISPLAY_NAME__: string
declare const __APP_BUILD_CHANNEL__: string | undefined
declare const __APP_IS_BETA__: boolean
declare const __AMLL_CORE_VERSION__: string
declare const __AMLL_VUE_VERSION__: string

interface ImportMetaEnv {
  readonly MODE: 'production' | 'development'
  readonly BASE_URL: string
  readonly PROD: boolean
  readonly DEV: boolean
  readonly SSR: boolean

  readonly VITE_BUILD_CHANNEL: 'STABLE' | 'BETA' | undefined
}
