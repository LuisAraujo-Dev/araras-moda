import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { MessageCircle, PackageOpen, Tag, AtSign } from "lucide-react";

type Props = {
  params: Promise<{ slug: string }> | { slug: string };
};

export default async function StorefrontPage(props: Props) {
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
    },
    include: {
      brand: true,
      size: true,
      images: {
        orderBy: { order: 'asc' },
        take: 1,
      },
    },
    orderBy: [
      { isFeatured: 'desc' },
      { updatedAt: 'desc' }
    ],
  });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const getWhatsAppLink = (pieceName: string, pieceCode: string) => {
    if (!config.whatsapp) return "#";
    const phone = config.whatsapp.replace(/\D/g, "");
    const text = encodeURIComponent(`Olá! Gostei da peça ${pieceName} (Ref: ${pieceCode}). Ainda está disponível?`);
    return `https://wa.me/${phone}?text=${text}`;
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans selection:bg-[#1E5AA8]/20">
      
      <header className="bg-white border-b border-zinc-200 pt-16 pb-12 px-4 shadow-sm">
        <div className="max-w-5xl mx-auto text-center">
          <div className="w-24 h-24 bg-[#0A244A] text-white rounded-full flex items-center justify-center mx-auto mb-5 text-4xl font-bold shadow-md">
            {config.company.name.charAt(0)}
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-[#0A244A] tracking-tight mb-3">
            {config.company.name}
          </h1>
          
          {config.description && (
            <p className="text-zinc-600 max-w-2xl mx-auto text-base leading-relaxed mb-8">
              {config.description}
            </p>
          )}
          
          <div className="flex flex-wrap items-center justify-center gap-3">
            {config.instagram && (
              <a 
                href={`https://instagram.com/${config.instagram}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 text-pink-700 bg-pink-50 border border-pink-100 px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-pink-100 transition-colors"
              >
                <AtSign className="w-4 h-4" /> @{config.instagram}
              </a>
            )}
            
            {config.whatsapp && (
              <a 
                href={`https://wa.me/${config.whatsapp.replace(/\D/g, "")}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 text-emerald-800 bg-emerald-50 border border-emerald-100 px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-emerald-100 transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> Fale Connosco
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-200">
          <h2 className="text-2xl font-bold text-[#0A244A]">Catálogo Disponível</h2>
          <span className="bg-zinc-200 text-zinc-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
            {pieces.length} {pieces.length === 1 ? 'peça' : 'peças'}
          </span>
        </div>

        {pieces.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-zinc-200 shadow-sm">
            <PackageOpen className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-zinc-700">Nenhuma peça na vitrine</h3>
            <p className="text-zinc-500 mt-2">Estamos a preparar novidades. Volte em breve!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {pieces.map((piece) => (
              <div 
                key={piece.id} 
                className="bg-white rounded-xl border border-zinc-200 overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col"
              >
                <div className="aspect-4/5 bg-zinc-100 relative flex items-center justify-center overflow-hidden">
                  {piece.images && piece.images.length > 0 ? (
                    <Image 
                      src={piece.images[0].imageUrl} 
                      alt={piece.name} 
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <Tag className="w-12 h-12 text-zinc-300" />
                  )}
                  
                  {piece.promoPrice && (
                    <div className="absolute top-3 right-3 z-10 bg-rose-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm tracking-wider">
                      PROMO
                    </div>
                  )}
                </div>
                
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-[#0A244A] text-sm line-clamp-2" title={piece.name}>
                      {piece.name}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4 text-xs text-zinc-500 font-medium">
                    {piece.size && (
                      <span className="bg-zinc-100 px-2 py-1 rounded border border-zinc-200">
                        {piece.size.name}
                      </span>
                    )}
                    {piece.brand && <span className="truncate">{piece.brand.name}</span>}
                  </div>

                  <div className="mt-auto pt-4 border-t border-zinc-100 flex items-end justify-between">
                    <div className="flex flex-col">
                      {piece.promoPrice ? (
                        <>
                          <span className="text-[11px] text-zinc-400 line-through mb-0.5">
                            {formatCurrency(piece.estimatedSalePrice)}
                          </span>
                          <span className="text-lg font-bold text-rose-600 leading-none">
                            {formatCurrency(piece.promoPrice)}
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-bold text-[#1E5AA8] leading-none">
                          {formatCurrency(piece.estimatedSalePrice)}
                        </span>
                      )}
                    </div>
                    
                    <a 
                      href={getWhatsAppLink(piece.name, piece.code)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#25D366] hover:bg-[#1EBE5D] text-white p-2.5 rounded-lg transition-transform hover:scale-105 cursor-pointer shrink-0"
                      title="Comprar via WhatsApp"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      
      <footer className="bg-white border-t border-zinc-200 py-8 text-center text-zinc-500 text-sm mt-12">
        <p>© {new Date().getFullYear()} {config.company.name}. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}