// Type declarations for Supabase Edge Functions

// Deno standard library types
declare module 'https://deno.land/std@0.177.0/http/server.ts' {
  export function serve(handler: (request: Request) => Response | Promise<Response>): void;
}

declare module 'https://deno.land/std@0.224.0/http/server.ts' {
  export function serve(handler: (request: Request) => Response | Promise<Response>): void;
}

// Supabase ESM module types
declare module "https://esm.sh/@supabase/supabase-js@2.39.3" {
  export interface SupabaseClient {
    from(table: string): any;
    auth: any;
    storage: any;
    functions: any;
  }
  
  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: any
  ): SupabaseClient;
}