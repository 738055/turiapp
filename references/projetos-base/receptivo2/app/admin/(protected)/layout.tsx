'use client';

import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/Layout/AdminLayout';
import { createClientComponentClient } from '@/lib/supabaseBrowser';
import { useRouter } from 'next/navigation';

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          window.location.href = '/admin/login';
          return;
        }

        // 1. Tenta buscar a role atualizada da tabela profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        // 2. PULO DO GATO: Se não tiver tabela profiles, usa o user_metadata (que era como estava antes)
        const role = profile?.role || session?.user?.user_metadata?.role;

        setUserRole(role || 'unauthorized');

        if (role === 'supplier') {
          router.push('/admin/supplier-dashboard');
        } else if (role === 'affiliate' || role === 'partner') {
          router.push('/admin/affiliate-dashboard');
        } else if (role !== 'admin' && role !== 'supplier') {
           // Se for cliente comum tentando acessar o admin, desloga
           await supabase.auth.signOut();
           // Usar window.location força o recarregamento, limpando o cache do Middleware
           window.location.href = '/admin/login?error=unauthorized';
        }
      } catch (error) {
        console.error('Erro ao checar permissões:', error);
        window.location.href = '/admin/login';
      } finally {
        setLoading(false);
      }
    };
    
    checkUserRole();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
          <p className="text-gray-500 font-medium">Carregando painel...</p>
        </div>
      </div>
    );
  }

  // Renderiza o Admin se for admin
  if (userRole === 'admin') {
    return <AdminLayout>{children}</AdminLayout>;
  }

  // Fallback visual enquanto o redirecionamento ocorre
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
       <p className="text-gray-500 font-medium animate-pulse">Redirecionando...</p>
    </div>
  );
}