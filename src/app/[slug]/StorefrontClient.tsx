"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { MessageCircle, AtSign, Sparkles, SlidersHorizontal, ShoppingBag, X, Check, Trash2, ImageIcon } from "lucide-react";

type PieceClean = {
  id: string;
  code: string;
  name: string;
  estimatedSalePrice: number;
  promoPrice: number | null;
  observations: string | null;
  isFeatured: boolean;
  imageUrl: string | null;
  categoryName: string;
  brandName: string | null;
};

type StorefrontClientProps = {
  config: {
    slug: string;
    description: string | null;
    whatsapp: string | null;
    instagram: string | null;
    logoUrl: string | null;
    company: { name: string };
  };
  pieces: PieceClean[];
  categories: string[];
  featuredPieces: PieceClean[];
  slug: string;
  currentCategory?: string;
};

export default function StorefrontClient({ config, pieces, categories, featuredPieces, slug, currentCategory }: StorefrontClientProps) {
  const [cart, setCart] = useState<PieceClean[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const formatCurrency = (val: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const addToCart = (piece: PieceClean) => {
    if (!cart.find(p => p.id === piece.id)) {
      setCart([...cart, piece]);
    }
    setIsCartOpen(true);
  };

  const removeFromCart = (pieceId: string) => {
    setCart(cart.filter(p => p.id !== pieceId));
  };

  const cartTotal = cart.reduce((acc, item) => {
    const price = item.promoPrice && item.promoPrice > 0 ? item.promoPrice : item.estimatedSalePrice;
    return acc + (price > 0 ? price : 0);
  }, 0);

  const sendWhatsAppOrder = () => {
    if (!config.whatsapp) return;
    const phone = config.whatsapp.replace(/\D/g, '');
    let text = "Olá! Tenho interesse nas seguintes peças do catálogo:\n\n";

    cart.forEach((item, index) => {
      const price = item.promoPrice && item.promoPrice > 0 ? item.promoPrice : item.estimatedSalePrice;
      const priceStr = price > 0 ? formatCurrency(price) : 'Valor sob Consulta';
      text += `${index + 1}. *${item.name}* (Ref: ${item.code}) - ${priceStr}\n`;
    });

    if (cartTotal > 0) {
      text += `\n*Total estimado: ${formatCurrency(cartTotal)}*`;
    }

    text += "\n\nAguardo o retorno para prosseguir!";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-[#0A244A] selection:text-white">
      
      <header className="bg-[#0A244A] text-white pt-16 pb-20 px-4 md:pt-24 md:pb-28 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10 flex flex-col items-center">
          
          {config.logoUrl ? (
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white/10 shadow-2xl mb-6 relative bg-white">
              <Image src={config.logoUrl} alt={config.company.name} fill className="object-cover" />
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
                    {piece.imageUrl && (
                      <Image src={piece.imageUrl} alt={piece.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 50vw, 25vw" />
                    )}
                    {piece.promoPrice && piece.promoPrice > 0 && (
                      <div className="absolute top-2 right-2 bg-rose-600 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm shadow-sm">
                        Sale
                      </div>
                    )}
                  </div>
                  <h3 className="text-xs md:text-sm font-medium text-zinc-900 truncate">{piece.name}</h3>
                  
                  {piece.promoPrice && piece.promoPrice > 0 ? (
                    <p className="text-rose-600 font-bold text-xs mt-1">
                      <span className="line-through text-zinc-400 font-normal mr-1">{formatCurrency(piece.estimatedSalePrice)}</span>
                      {formatCurrency(piece.promoPrice)}
                    </p>
                  ) : (
                    <p className="text-[#1E5AA8] font-bold text-xs mt-1">{piece.estimatedSalePrice > 0 ? formatCurrency(piece.estimatedSalePrice) : 'Consultar'}</p>
                  )}
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
        {pieces.length === 0 ? (
          <div className="text-center py-20 text-zinc-400 font-light tracking-wide">
            Nenhuma peça encontrada nesta secção.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
            {pieces.map((piece) => {
              const inCart = cart.some(p => p.id === piece.id);
              
              return (
              <article key={piece.id} className="group flex flex-col bg-white p-3 rounded-xl border border-transparent hover:border-zinc-200 hover:shadow-lg transition-all duration-300">
                <div className="relative w-full aspect-3/4 bg-zinc-100 rounded-lg overflow-hidden mb-4">
                  {piece.imageUrl ? (
                    <Image src={piece.imageUrl} alt={piece.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-300 font-light text-sm tracking-wide">Sem imagem</div>
                  )}
                  {piece.brandName && (
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-900 rounded-sm shadow-sm">
                      {piece.brandName}
                    </div>
                  )}
                  {piece.promoPrice && piece.promoPrice > 0 && (
                    <div className="absolute top-3 right-3 bg-rose-600 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm shadow-sm">
                      Sale
                    </div>
                  )}
                </div>

                <div className="px-1 flex-1 flex flex-col">
                  <h3 className="text-sm font-medium text-zinc-900 leading-snug tracking-wide line-clamp-2 mb-1">{piece.name}</h3>
                  {piece.observations && (
                    <p className="text-xs text-zinc-500 font-light line-clamp-1 mb-2 tracking-wide">{piece.observations}</p>
                  )}
                  
                  <div className="flex justify-between items-end mt-auto pt-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-zinc-400 font-light uppercase tracking-wider">Ref: {piece.code}</span>
                      
                      {piece.promoPrice && piece.promoPrice > 0 ? (
                        <span className="text-sm font-bold text-rose-600 mt-0.5">
                          <span className="line-through text-zinc-400 font-normal mr-1.5 text-xs">{formatCurrency(piece.estimatedSalePrice)}</span>
                          {formatCurrency(piece.promoPrice)}
                        </span>
                      ) : (
                        <span className="text-sm font-bold text-[#0A244A] mt-0.5">
                          {piece.estimatedSalePrice > 0 ? formatCurrency(piece.estimatedSalePrice) : 'Consultar Valor'}
                        </span>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => inCart ? removeFromCart(piece.id) : addToCart(piece)}
                      className={`p-2 rounded-full transition-colors cursor-pointer ${inCart ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-zinc-100 hover:bg-[#0A244A] hover:text-white text-zinc-600'}`} 
                      title={inCart ? "Remover da sacola" : "Adicionar à Sacola"}
                    >
                      {inCart ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </article>
            )})}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-zinc-200 py-12 text-center pb-32">
        <p className="text-[10px] text-zinc-400 font-bold tracking-[0.2em] uppercase">
          © {new Date().getFullYear()} {config.company.name}. Desenvolvido pela Arara Moda.
        </p>
      </footer>

      {cart.length > 0 && (
        <button 
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-[#0A244A] hover:bg-[#1E5AA8] text-white p-4 rounded-full shadow-2xl transition-transform hover:scale-105 cursor-pointer flex items-center gap-3"
        >
          <div className="relative">
            <ShoppingBag className="w-6 h-6" />
            <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#0A244A]">
              {cart.length}
            </span>
          </div>
          <span className="font-semibold text-sm hidden sm:block">Finalizar</span>
        </button>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
          
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300">
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
              <h2 className="text-lg font-bold text-[#0A244A] flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" /> Sua Sacola
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-900 rounded-full hover:bg-zinc-200 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                  <ShoppingBag className="w-12 h-12 mb-3 opacity-20" />
                  <p className="font-light tracking-wide">A sua sacola está vazia.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {cart.map((item) => (
                    <div key={`cart-${item.id}`} className="flex gap-3 items-center p-2 rounded-lg border border-zinc-100 hover:border-zinc-200 transition-colors bg-white">
                      <div className="w-16 h-20 bg-zinc-50 rounded-md relative overflow-hidden shrink-0">
                        {item.imageUrl ? <Image src={item.imageUrl} alt={item.name} fill className="object-cover" /> : <ImageIcon className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-zinc-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 truncate">{item.name}</p>
                        <p className="text-[10px] text-zinc-500 mb-1">Ref: {item.code}</p>
                        <p className="text-sm font-bold text-[#1E5AA8]">
                          {item.promoPrice && item.promoPrice > 0 ? formatCurrency(item.promoPrice) : formatCurrency(item.estimatedSalePrice)}
                        </p>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-5 border-t border-zinc-100 bg-zinc-50">
                <div className="flex justify-between items-end mb-5">
                  <span className="text-sm text-zinc-500 font-medium">Total estimado:</span>
                  <span className="text-2xl font-bold text-[#0A244A]">{formatCurrency(cartTotal)}</span>
                </div>
                <button 
                  onClick={sendWhatsAppOrder}
                  className="w-full h-12 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-lg font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-transform hover:scale-[1.02]"
                >
                  <MessageCircle className="w-5 h-5" />
                  Enviar Pedido por WhatsApp
                </button>
                <p className="text-center text-[10px] text-zinc-400 mt-3 font-medium">O pagamento e envio serão combinados diretamente com o vendedor.</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}