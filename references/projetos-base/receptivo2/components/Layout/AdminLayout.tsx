'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClientComponentClient } from '@/lib/supabaseBrowser';
import {
  LayoutDashboard,
  ShoppingBag,
  Calendar,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  PieChart,
  DollarSign,
  Tag,
  Truck,
  ClipboardList,
  Car,
  UserCheck
} from 'lucide-react';
import { BrandLogo } from '@/components/Frontend/BrandLogo';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Usamos o cliente correto para lidar com os cookies no logout
  const supabase = createClientComponentClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Usar window.location.href força o navegador a limpar o cache das rotas
    window.location.href = '/admin/login';
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: ClipboardList, label: 'Operações (OS)', path: '/admin/operations' },
    { icon: Car, label: 'Veículos', path: '/admin/vehicles' },
    { icon: UserCheck, label: 'Motoristas / Guias', path: '/admin/drivers' },
    { icon: ShoppingBag, label: 'Produtos', path: '/admin/products' },
    { icon: Calendar, label: 'Reservas', path: '/admin/bookings' },
    { icon: DollarSign, label: 'Financeiro', path: '/admin/finance' },
    { icon: Calendar, label: 'Calendário', path: '/admin/calendar' },
    { icon: Users, label: 'Clientes', path: '/admin/customers' },
    { icon: FileText, label: 'Conteúdo', path: '/admin/content' },
    { icon: Truck, label: 'Fornecedores', path: '/admin/suppliers' },
    { icon: Tag, label: 'Cupons', path: '/admin/coupons' },
    { icon: PieChart, label: 'Relatórios', path: '/admin/reports' },
    { icon: Settings, label: 'Configurações', path: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center border-b border-gray-100 px-5">
            <BrandLogo height={34} />
            <button className="ml-auto lg:hidden" onClick={() => setIsSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-[#0284c7]/10 text-[#0284c7]' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon size={20} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
            >
              <LogOut size={16} />
              Sair do Sistema
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 lg:hidden h-16 flex items-center px-4">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-gray-600">
            <Menu size={24} />
          </button>
          <span className="ml-4 font-bold text-gray-800">Painel Administrativo</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
