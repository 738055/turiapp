import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient'; // <-- AQUI MUDOU: Importamos 'supabase' e não 'createClient'

export async function GET() {
  try {
    // Verificação de segurança caso as chaves não tenham carregado
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    const { data, error } = await supabase
      .from('tours') // Pode manter 'tours' ou outra tabela que exista
      .select('id')
      .limit(1);

    if (error) throw error;

    return NextResponse.json({ 
      status: 'Ok', 
      message: 'Supabase is active', 
      timestamp: new Date().toISOString() 
    });

  } catch (error) {
    // console.error(error); // Pode descomentar para debug se precisar
    return NextResponse.json({ 
      status: 'Error', 
      error: 'Failed to wake database',
      timestamp: new Date().toISOString() 
    }, { status: 500 });
  }
}