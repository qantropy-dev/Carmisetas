import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetail } from '@/components/product/product-detail';
import { tokensToCss } from '@/lib/color';
import { publicEnv } from '@/lib/env';
import { getActiveSlugs, getProductBySlug } from '@/lib/queries/products';

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getActiveSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Prenda no encontrada' };

  const color = product.colors[0];
  const description =
    product.description ?? product.headline ?? `${product.name}. Camisetas y suéteres de Carmisetas.`;

  return {
    title: product.name,
    description,
    alternates: { canonical: `/prenda/${product.slug}` },
    openGraph: {
      type: 'website',
      title: product.name,
      description,
      url: `/prenda/${product.slug}`,
      ...(color?.cutoutUrl ? { images: [{ url: color.cutoutUrl, alt: product.name }] } : {}),
    },
  };
}

export default async function PrendaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product || product.colors.length === 0) notFound();

  const color = product.colors[0];
  if (!color) notFound();

  /* schema.org/Product: una oferta por variante, con su precio y su
     disponibilidad reales. Es lo que leen los buscadores. */
  const site = publicEnv().NEXT_PUBLIC_SITE_URL;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? product.headline ?? undefined,
    sku: product.slug,
    image: product.colors.flatMap((c) => (c.cutoutUrl ? [new URL(c.cutoutUrl, site).href] : [])),
    brand: { '@type': 'Brand', name: 'Carmisetas' },
    ...(product.material ? { material: product.material } : {}),
    offers: product.colors.flatMap((c) =>
      c.variants.map((variant) => ({
        '@type': 'Offer',
        url: `${site}/prenda/${product.slug}`,
        priceCurrency: 'COP',
        price: variant.price,
        sku: variant.sku ?? undefined,
        availability: variant.available
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition',
      })),
    ),
  };

  return (
    <main>
      {/* El escenario del color inicial, resuelto en el servidor. */}
      <style dangerouslySetInnerHTML={{ __html: tokensToCss(color.ambient) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetail product={product} />
    </main>
  );
}
