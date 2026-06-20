import Link from 'next/link';
 
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-4">
      <p className="text-primary-700 font-semibold mb-2">Erro 404</p>
      <h2 className="text-3xl font-bold text-secondary mb-3">Página não encontrada</h2>
      <p className="text-gray-500 mb-8 max-w-md">O destino que você procura não está no nosso mapa. Que tal voltar e explorar os passeios?</p>
      <div className="flex gap-3">
        <Link href="/" className="bg-primary text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-primary-dark transition-colors">
          Voltar ao início
        </Link>
        <Link href="/tours/search" className="bg-white border border-gray-200 text-secondary font-semibold py-2.5 px-6 rounded-lg hover:bg-gray-50 transition-colors">
          Ver passeios
        </Link>
      </div>
    </div>
  );
}