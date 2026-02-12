// This file is for TypeScript type definitions.
// The Supabase credentials have been moved directly into the Supabase service
// as the execution environment does not support `process.env`.
declare global {
  // FIX: Augment the NodeJS namespace to avoid redeclaring the global 'process' variable.
  namespace NodeJS {
    interface ProcessEnv {
      SUPABASE_URL: string;
      SUPABASE_KEY: string;
      [key: string]: string | undefined;
    }
  }
}
export {};
