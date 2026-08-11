import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import StorefrontClient from "./StorefrontClient";

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

  const piecesData = await prisma.piece.findMany({
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

  // Limpar os dados para passar de forma segura para o lado do cliente (Client Component)
  const cleanPieces = piecesData.map(p => ({
    id: p.id,
    code: p.code,
    name: p.name,
    estimatedSalePrice: p.estimatedSalePrice || 0,
    promoPrice: p.promoPrice || 0,
    observations: p.observations || "",
    isFeatured: p.isFeatured,
    imageUrl: p.images && p.images.length > 0 ? p.images[0].imageUrl : null,
    categoryName: p.category?.name || "Outros",
    brandName: p.brand?.name || null
  }));

  const categories = Array.from(new Set(cleanPieces.map(p => p.categoryName))).sort();

  const filteredPieces = currentCategory 
    ? cleanPieces.filter(p => p.categoryName === currentCategory)
    : cleanPieces;

  const featuredPieces = cleanPieces.filter(p => p.isFeatured);

  const cleanConfig = {
    slug: config.slug,
    description: config.description,
    whatsapp: config.whatsapp,
    instagram: config.instagram,
    logoUrl: config.logoUrl,
    company: { name: config.company.name }
  };

  return (
    <StorefrontClient 
      config={cleanConfig}
      pieces={filteredPieces}
      categories={categories}
      featuredPieces={featuredPieces}
      slug={slug}
      currentCategory={currentCategory}
    />
  );
}