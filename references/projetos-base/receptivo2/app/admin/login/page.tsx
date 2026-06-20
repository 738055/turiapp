'use client';

import React, { useState } from 'react';
import { createClientComponentClient } from '@/lib/supabaseBrowser';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2, ArrowRight, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  // Inicializa o cliente Supabase para componentes client-side (navegador)
  const supabase = createClientComponentClient();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Tenta realizar o login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.session) {
        throw new Error('Não foi possível estabelecer a sessão.');
      }

      // 2. Verifica se o usuário tem permissão de admin
      // Nota: A segurança real está no Middleware e RLS, isso é apenas para UX
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.session.user.id)
        .single();

      if (profileError || profile?.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('Acesso negado. Apenas administradores podem acessar esta área.');
      }

      // 3. Login bem-sucedido: Força o refresh para atualizar os cookies no servidor
      router.refresh();
      
      // 4. Redireciona para o dashboard
      router.push('/admin/dashboard');

    } catch (err: any) {
      console.error('Erro no login:', err);
      setLoading(false);
      
      if (err.message === 'Invalid login credentials') {
        setErrorMsg('E-mail ou senha incorretos.');
      } else {
        setErrorMsg(err.message || 'Ocorreu um erro ao tentar entrar.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-200">
            <Lock className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="text-gray-500 text-sm mt-2">Pratik Turismo - Acesso Seguro</p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl mb-6 border border-red-100 flex items-center gap-3">
            <AlertCircle size={18} className="shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wide">
              E-mail Corporativo
            </label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-primary-600 transition-colors" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="admin@pratikturismo.com.br"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wide">
              Senha
            </label>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-primary-600 transition-colors" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Autenticando...</span>
              </>
            ) : (
              <>
                <span>Acessar Dashboard</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}