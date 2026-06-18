import { WifiOff } from "lucide-react";

export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <WifiOff className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900">Você está offline</h1>
        <p className="text-sm text-gray-500 mt-2">Verifique sua conexão. As páginas já visitadas continuam disponíveis.</p>
      </div>
    </main>
  );
}
