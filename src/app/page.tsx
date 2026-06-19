import Link from "next/link";
import { buttonVariants } from "@/components/ui/button"; // Importamos os estilos base do botão
import { ArrowRight, Store, Package, TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header com a Logo e botão de Entrar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-zinc-200 bg-white">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-zinc-900 rounded-lg">
            <Store className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-zinc-900">Araras Moda</span>
        </div>
        {/* Passamos o estilo de botão diretamente para o Link */}
        <Link 
          href="/login"
          className={`${buttonVariants({ variant: "outline" })} font-medium cursor-pointer`}
        >
          Entrar no Sistema
        </Link>
      </header>

      {/* Seção Principal (Hero) */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-4xl space-y-8">
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-zinc-900">
            Gestão inteligente para a sua <span className="text-emerald-600">curadoria de moda</span>
          </h1>
          <p className="text-lg sm:text-xl text-zinc-600 max-w-2xl mx-auto">
            Assuma o controlo total do seu inventário de garimpo, automatize contratos de consignação com parceiros e tenha visibilidade financeira clara em tempo real.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {/* O mesmo aqui para o botão grande principal */}
            <Link 
              href="/login"
              className={`${buttonVariants({ size: "lg" })} h-12 px-8 text-base gap-2 bg-zinc-900 hover:bg-zinc-800 text-white cursor-pointer`}
            >
              Acessar o meu Painel <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Destaques (Features) */}
          <div className="grid sm:grid-cols-3 gap-8 pt-16 mt-12 border-t border-zinc-200 text-left">
            <div className="space-y-3">
              <div className="p-3 bg-white border border-zinc-200 rounded-xl inline-block mb-2 shadow-sm">
                <Package className="w-6 h-6 text-zinc-700" />
              </div>
              <h3 className="font-semibold text-lg text-zinc-900">Estoque Preciso</h3>
              <p className="text-sm text-zinc-500">
                Gira lotes de compra, catálogo de peças únicas e receba alertas automáticos de produtos estagnados.
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 bg-white border border-zinc-200 rounded-xl inline-block mb-2 shadow-sm">
                <HandshakeIcon className="w-6 h-6 text-zinc-700" />
              </div>
              <h3 className="font-semibold text-lg text-zinc-900">Consignações</h3>
              <p className="text-sm text-zinc-500">
                Emita contratos digitais e acompanhe a transferência de peças para lojas e brechós parceiros.
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 bg-white border border-zinc-200 rounded-xl inline-block mb-2 shadow-sm">
                <TrendingUp className="w-6 h-6 text-zinc-700" />
              </div>
              <h3 className="font-semibold text-lg text-zinc-900">Raio-X Financeiro</h3>
              <p className="text-sm text-zinc-500">
                Saiba o seu lucro líquido exato com o rateio inteligente de despesas e custos operacionais por peça.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Rodapé simples */}
      <footer className="py-6 text-center border-t border-zinc-200 bg-white text-zinc-500 text-sm">
        <p>© {new Date().getFullYear()} Araras Moda. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

// Componente ícone extra para o destaque
function HandshakeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m11 17 2 2a1 1 0 1 0 3-3" />
      <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
      <path d="m21 3 1 11h-2" />
      <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
      <path d="M3 4h8" />
    </svg>
  )
}