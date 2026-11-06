/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WHOP_ACCOUNT_ID?: string;
  readonly VITE_WHOP_INSPECTION_PLAN_ID?: string;
  readonly VITE_WHOP_DEPOSIT_PLAN_ID?: string;
  readonly VITE_WHOP_SERVICE_PLAN_ID?: string;
  readonly WHOP_API_KEY?: string;
  readonly WHOP_ENVIRONMENT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
