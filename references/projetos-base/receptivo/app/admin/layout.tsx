// app/admin/layout.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Package, Newspaper, LogOut, LayoutDashboard, Lock, HelpCircle, Settings, Building2, Ticket, Briefcase } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import Button from '@/components/Button';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setLoading(false);
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });
      return () => subscription.unsubscribe();
    } else {
       setLoading(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
        if(email === 'admin@a10.com' && password === 'admin') setSession({ user: { email: 'admin' } });
        return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    router.push('/');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm space-y-4">
          <div className="flex justify-center text-primary mb-2"><Lock size={32}/></div>
          <h1 className="font-bold text-2xl text-center text-gray-800">Admin A10</h1>
          <input 
            type="email" value={email} onChange={e=>setEmail(e.target.value)} 
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none" 
            placeholder="admin@a10.com" 
          />
          <input 
            type="password" value={password} onChange={e=>setPassword(e.target.value)} 
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none" 
            placeholder="Senha" 
          />
          <Button fullWidth>Entrar</Button>
        </form>
      </div>
    );
  }

  const menuItems = [
    { label: 'Experiências', icon: Package, href: '/admin/experiences' },
    { label: 'Blog & Info', icon: Newspaper, href: '/admin/posts' },
    { label: 'Categorias', icon: LayoutDashboard, href: '/admin/categories' },
    { label: 'FAQ (Perguntas)', icon: HelpCircle, href: '/admin/faq' },
    { label: 'Empresas', icon: Briefcase, href: '/admin/companies' },
    { label: 'Agências', icon: Building2, href: '/admin/agencies' },
    { label: 'Vouchers', icon: Ticket, href: '/admin/vouchers' },
    { label: 'Pixel & Tags', icon: Settings, href: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full z-20 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-serif font-bold text-xl text-primary">A10 Admin</h2>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link 
                key={item.href}
                href={item.href}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActive ? 'bg-green-50 text-primary' : 'hover:bg-gray-50 text-gray-600'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 hover:text-red-700 w-full px-4 text-sm font-medium">
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-8 overflow-y-auto h-screen">
        {children}
      </main>
    </div>
  );
}