import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MfaSetup } from "@/components/admin/MfaSetup";
import { MapPin } from "lucide-react";

export default async function MfaEnrollPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { next } = await searchParams;
  const destination = next ?? "/admin";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-sky-500 mb-4">
            <MapPin className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Verificação em duas etapas obrigatória</h1>
          <p className="text-sm text-gray-500 mt-1">
            Esta conta exige um app autenticador para acessar o painel.
          </p>
        </div>

        <MfaSetup mandatory />

        <div className="text-center text-sm">
          <Link href={destination} className="text-sky-600 hover:underline">
            Já ativei, continuar para o painel
          </Link>
        </div>
      </div>
    </div>
  );
}
