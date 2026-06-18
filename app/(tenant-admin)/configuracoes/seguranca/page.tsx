import { MfaSetup } from "@/components/admin/MfaSetup";

export default function SegurancaPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Segurança</h1>
        <p className="text-gray-500 text-sm mt-1">
          Proteja sua conta com verificação em duas etapas
        </p>
      </div>

      <MfaSetup />
    </div>
  );
}
