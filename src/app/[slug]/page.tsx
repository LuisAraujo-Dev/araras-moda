//src/app/[slug]/page.tsx
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MessageCircle, AtSign, ArrowRight, Sparkles, SlidersHorizontal } from "lucide-react";

export default async function PublicStorefrontPage(props: {
  params: Promise<{ slug: string }> | { slug: string };
  searchParams: Promise<{ cat?: string }> | { cat?: string };
}) {
  const resolvedParams = await props.params;
  const resolvedSearchParams = await props.searchParams;
  const slug = resolvedParams.slug;
  const currentCategory = resolvedSearchParams?.cat;

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

  const categories = Array.from(new Set(pieces.map(p => p.category.name))).sort();

  const filteredPieces = currentCategory 
    ? pieces.filter(p => p.category.name === currentCategory)
    : pieces;

  const featuredPieces = pieces.slice(0, 4);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const generateWhatsAppLink = (pieceName: string, pieceCode: string) => {
    if (!config.whatsapp) return "#";
    const phone = config.whatsapp.replace(/\D/g, '');
    const text = encodeURIComponent(`Olá! Tenho interesse na peça *${pieceName}* (Ref: ${pieceCode}) que vi no catálogo online.`);
    return `https://wa.me/${phone}?text=${text}`;
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-[#0A244A] selection:text-white">
      
      <header className="bg-[#0A244A] text-white pt-16 pb-20 px-4 md:pt-24 md:pb-28 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10 flex flex-col items-center">
          
          {config.bannerUrl ? (
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white/10 shadow-2xl mb-6 relative">
              <Image src={config.bannerUrl} alt={config.company.name} fill className="object-cover" />
            </div>
          ) : (
            <div className="w-20 h-20 md:w-24 md:h-24 bg-white text-[#0A244A] rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold shadow-2xl">
              {config.company.name.charAt(0)}
            </div>
          )}

          <h1 className="text-3xl md:text-5xl font-light tracking-widest uppercase mb-4">
            {config.company.name}
          </h1>
          
          {config.description && (
            <p className="text-zinc-300 max-w-xl mx-auto text-sm md:text-base font-light tracking-wide leading-relaxed mb-8">
              {config.description}
            </p>
          )}

          <div className="flex gap-4">
            {config.instagram && (
              <a href={`https://instagram.com/${config.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium tracking-wider">
                <AtSign className="w-4 h-4" /> Instagram
              </a>
            )}
            {config.whatsapp && (
              <a href={`https://wa.me/${config.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1E5AA8] hover:bg-[#15427d] transition-colors text-white text-sm font-medium tracking-wider shadow-lg">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            )}
          </div>
        </div>
      </header>

      {!currentCategory && featuredPieces.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20 mb-16">
          <div className="bg-white rounded-2xl shadow-xl border border-zinc-100 p-6 md:p-10">
            <div className="flex items-center gap-2 mb-8">
              <Sparkles className="w-5 h-5 text-[#1E5AA8]" />
              <h2 className="text-xl font-medium tracking-widest uppercase text-[#0A244A]">Destaques da Coleção</h2>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              {featuredPieces.map((piece) => (
                <div key={`feat-${piece.id}`} className="group cursor-pointer">
                  <div className="relative aspect-3/4 bg-zinc-100 rounded-lg overflow-hidden mb-4">
                    {piece.images && piece.images.length > 0 && (
                      <Image src={piece.images[0].imageUrl} alt={piece.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 50vw, 25vw" />
                    )}
                  </div>
                  <h3 className="text-xs md:text-sm font-medium text-zinc-900 truncate">{piece.name}</h3>
                  <p className="text-[#1E5AA8] font-bold text-xs mt-1">{piece.estimatedSalePrice > 0 ? formatCurrency(piece.estimatedSalePrice) : 'Consultar'}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4 overflow-x-auto custom-scrollbar pb-1">
            <SlidersHorizontal className="w-4 h-4 text-zinc-400 shrink-0" />
            <Link href={`/${slug}`} className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${!currentCategory ? 'bg-[#0A244A] text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}>
              Todas as Peças
            </Link>
            {categories.map(cat => (
              <Link key={cat} href={`/${slug}?cat=${encodeURIComponent(cat)}`} className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${currentCategory === cat ? 'bg-[#0A244A] text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}>
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 min-h-[50vh]">
        {filteredPieces.length === 0 ? (
          <div className="text-center py-20 text-zinc-400 font-light tracking-wide">
            Nenhuma peça encontrada nesta secção.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
            {filteredPieces.map((piece) => (
              <article key={piece.id} className="group flex flex-col bg-white p-3 rounded-xl border border-transparent hover:border-zinc-200 hover:shadow-lg transition-all duration-300">
                <div className="relative w-full aspect-3/4 bg-zinc-100 rounded-lg overflow-hidden mb-4">
                  {piece.images && piece.images.length > 0 ? (
                    <Image src={piece.images[0].imageUrl} alt={piece.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-300 font-light text-sm tracking-wide">Sem imagem</div>
                  )}
                  {piece.brand && (
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-900 rounded-sm shadow-sm">
                      {piece.brand.name}
                    </div>
                  )}
                </div>

                <div className="px-1 flex-1 flex flex-col">
                  <h3 className="text-sm font-medium text-zinc-900 leading-snug tracking-wide line-clamp-2 mb-1">{piece.name}</h3>
                  <div className="flex justify-between items-end mt-auto pt-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-zinc-400 font-light uppercase tracking-wider">Ref: {piece.code}</span>
                      <span className="text-sm font-bold text-[#0A244A] mt-0.5">
                        {piece.estimatedSalePrice > 0 ? formatCurrency(piece.estimatedSalePrice) : 'Consultar Valor'}
                      </span>
                    </div>
                    <a href={generateWhatsAppLink(piece.name, piece.code)} target="_blank" rel="noopener noreferrer" className="bg-[#1E5AA8] hover:bg-[#0A244A] text-white p-2 rounded-full transition-colors" title="Tenho Interesse">
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-zinc-200 py-12 text-center">
        <p className="text-[10px] text-zinc-400 font-bold tracking-[0.2em] uppercase">
          © {new Date().getFullYear()} {config.company.name}. Desenvolvido pela Arara Moda.
        </p>
      </footer>
    </div>
  );
}