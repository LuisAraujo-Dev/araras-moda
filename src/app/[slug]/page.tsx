import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MessageCircle, AtSign, ArrowRight } from "lucide-react";

type Props = {
  params: Promise<{ slug: string }> | { slug: string };
};

export default async function PublicStorefrontPage(props: Props) {
  const resolvedParams = await props.params;
  const slug = resolvedParams.slug;

  const config = await prisma.storefrontConfig.findUnique({
    where: { slug },
    include: { company: true },
  });

  if (!config) {
    notFound();
  }

  const pieces = await prisma.piece.findMany({
    where: {
      companyId: config.companyId,
      isPublished: true,
      status: { not: "VENDIDA" }
    },
    include: {
      images: { orderBy: { order: 'asc' } },
      brand: true,
      size: true,
      category: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const generateWhatsAppLink = (pieceName: string, pieceCode: string) => {
    if (!config.whatsapp) return "#";
    const phone = config.whatsapp.replace(/\D/g, '');
    const text = encodeURIComponent(`Olá! Tenho interesse na peça *${pieceName}* (Ref: ${pieceCode}) que vi no catálogo online.`);
    return `https://wa.me/${phone}?text=${text}`;
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-zinc-100">
      
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="w-1/4"></div>
          <div className="w-2/4 text-center">
            <h1 className="text-sm sm:text-base md:text-lg font-bold tracking-[0.25em] uppercase text-zinc-900 truncate">
              {config.company.name}
            </h1>
          </div>
          <div className="w-1/4 flex justify-end gap-3 sm:gap-5">
            {config.instagram && (
              <a href={`https://instagram.com/${config.instagram}`} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-900 transition-colors">
                <AtSign className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} />
              </a>
            )}
            {config.whatsapp && (
              <a href={`https://wa.me/${config.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-900 transition-colors">
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} />
              </a>
            )}
          </div>
        </div>
      </nav>

      {config.description && (
        <section className="py-20 md:py-32 px-4 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-light tracking-tight text-zinc-900 mb-6 leading-tight">
            Curadoria Exclusiva
          </h2>
          <p className="text-zinc-500 text-sm md:text-base font-light leading-relaxed tracking-wide">
            {config.description}
          </p>
        </section>
      )}

      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${!config.description ? 'pt-16' : ''} pb-32`}>
        {pieces.length === 0 ? (
          <div className="text-center py-32 text-zinc-400 font-light tracking-wide">
            O catálogo está a ser atualizado. Volte em breve.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-16">
            {pieces.map((piece) => (
              <article key={piece.id} className="group flex flex-col">
                
                <div className="relative w-full aspect-3/4 bg-zinc-50 mb-5 overflow-hidden">
                  {piece.images && piece.images.length > 0 ? (
                    <Image 
                      src={piece.images[0].imageUrl} 
                      alt={piece.name} 
                      fill 
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out" 
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-300 font-light text-sm tracking-wide">
                      Sem imagem
                    </div>
                  )}
                  
                  {piece.brand && (
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-900 shadow-sm">
                      {piece.brand.name}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-zinc-900 leading-snug tracking-wide">
                      {piece.name}
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-1.5 font-light tracking-wide uppercase">
                      REF: {piece.code} {piece.size ? `| TAM: ${piece.size.name}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-zinc-900">
                      {piece.estimatedSalePrice > 0 
                        ? formatCurrency(piece.estimatedSalePrice) 
                        : <span className="text-[10px] uppercase tracking-widest text-zinc-400 border-b border-zinc-200 pb-0.5">Consultar</span>}
                    </p>
                  </div>
                </div>

                <a 
                  href={generateWhatsAppLink(piece.name, piece.code)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-6 flex items-center justify-between w-full border-b border-zinc-200 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-900 hover:border-zinc-900 transition-all duration-300"
                >
                  <span>Tenho Interesse</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1.5 transition-transform" />
                </a>
              </article>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-100 py-12 text-center">
        <p className="text-[10px] text-zinc-400 font-light tracking-[0.2em] uppercase">
          © {new Date().getFullYear()} {config.company.name}. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}