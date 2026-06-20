import { redirect } from 'next/navigation';

// /admin → redireciona para login (o layout de (protected) trata a sessão)
export default function AdminRootPage() {
  redirect('/admin/login');
}
