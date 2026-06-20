// lib/supabaseBrowser.ts
// Wrapper sobre o cliente de browser do Supabase com fallback de env vars.
//
// `createClientComponentClient` do @supabase/auth-helpers-nextjs lança erro
// se NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY não estiverem
// definidas — o que quebra o `next build` (prerender) quando o ambiente não
// tem essas variáveis. Aqui passamos placeholders explícitos como fallback,
// seguindo o mesmo padrão de lib/supabase.ts. Em produção (Vercel), as
// variáveis NEXT_PUBLIC_* reais são inlinadas em tempo de build.

import { createClientComponentClient as createSupabaseClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function createClientComponentClient() {
  return createSupabaseClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
  });
}
