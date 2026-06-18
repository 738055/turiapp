import { MfaSetup } from "@/components/admin/MfaSetup";

export default function AdminSegurancaPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Segurança</h1>
        <p className="text-gray-400 text-sm mt-1">
          Verificação em duas etapas é obrigatória para contas de super admin
        </p>
      </div>

      <MfaSetup mandatory />
    </div>
  );
}
