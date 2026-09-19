/**
 * Catalogo semilla. Fuente unica de la que salen DOS cosas:
 *   1. `scripts/build-seed-assets.ts` -> los recortes PNG en public/seed
 *   2. `scripts/build-seed-sql.ts`    -> supabase/seed.sql
 * Asi las imagenes y las filas nunca se desincronizan.
 */

export type Size = 'S' | 'M' | 'L' | 'XL' | 'XXL';
export type StockStatus = 'disponible' | 'pocas' | 'agotado';
export type Silhouette = 'tee' | 'crewneck' | 'hoodie' | 'cardigan';

export const SIZES: readonly Size[] = ['S', 'M', 'L', 'XL', 'XXL'];

export type SeedColor = {
  name: string;
  /** El color de la prenda. */
  swatch: string;
  /** El color del escenario cuando esta prenda esta activa. */
  ambient: string;
  /** Desviaciones del stock por defecto (todo 'disponible'). */
  stock?: Partial<Record<Size, StockStatus>>;
  /** Sobreprecio por talla, si aplica. */
  priceOverride?: Partial<Record<Size, number>>;
};

export type SeedProduct = {
  slug: string;
  name: string;
  headline: string;
  description: string;
  category: string;
  collections: string[];
  silhouette: Silhouette;
  basePrice: number;
  compareAtPrice?: number;
  fit: string;
  material: string;
  care: string;
  isFeatured: boolean;
  colors: SeedColor[];
};

export const CATEGORIES = [
  { name: 'Camisetas', slug: 'camisetas' },
  { name: 'Suéteres', slug: 'sueteres' },
];

export const COLLECTIONS = [
  { name: 'Esencial', slug: 'esencial' },
  { name: 'Nocturno', slug: 'nocturno' },
  { name: 'Tejido', slug: 'tejido' },
  { name: 'Archivo', slug: 'archivo' },
];

export const PRODUCTS: SeedProduct[] = [
  {
    slug: 'camiseta-bruma',
    name: 'Camiseta Bruma',
    headline: 'El peso justo del algodón',
    description:
      'Jersey de 240 g tejido en Medellín. Hombro caído, cuerpo recto y un cuello acanalado que no se abre con el uso. La prenda base de todo lo demás.',
    category: 'camisetas',
    collections: ['esencial', 'archivo'],
    silhouette: 'tee',
    basePrice: 89900,
    fit: 'Oversize · hombro caído',
    material: '100% algodón peinado 240 g/m²',
    care: 'Lavar a máquina en frío del revés. No usar secadora. Planchar a temperatura media.',
    isFeatured: true,
    colors: [
      { name: 'Hueso', swatch: '#F2ECE1', ambient: '#DFD5C4', stock: { XXL: 'pocas' } },
      { name: 'Arena', swatch: '#D9C6AB', ambient: '#EEE4D3', stock: { S: 'agotado' } },
    ],
  },
  {
    slug: 'camiseta-sereno',
    name: 'Camiseta Sereno',
    headline: 'Corte recto, caída limpia',
    description:
      'Silueta boxy de cuerpo corto y manga ancha. Teñida en prenda para que el color asiente parejo y envejezca bien.',
    category: 'camisetas',
    collections: ['esencial', 'nocturno'],
    silhouette: 'tee',
    basePrice: 94900,
    compareAtPrice: 119900,
    fit: 'Boxy · cuerpo corto',
    material: '100% algodón orgánico 220 g/m², teñido en prenda',
    care: 'Lavar a máquina en frío con colores similares. Secar a la sombra.',
    isFeatured: true,
    colors: [
      { name: 'Niebla', swatch: '#B9C9D6', ambient: '#D7E1E8' },
      { name: 'Carbón', swatch: '#33363B', ambient: '#1C1E22', stock: { S: 'pocas', XXL: 'agotado' } },
    ],
  },
  {
    slug: 'camiseta-senal',
    name: 'Camiseta Señal',
    headline: 'Un solo color, dicho fuerte',
    description:
      'La más pesada de la línea: 280 g que se sostienen solos. Costura lateral reforzada y bajo con dobladillo doble.',
    category: 'camisetas',
    collections: ['archivo'],
    silhouette: 'tee',
    basePrice: 99900,
    fit: 'Regular · estructura firme',
    material: '100% algodón 280 g/m²',
    care: 'Lavar a máquina en frío. No usar blanqueador. Secar en plano.',
    isFeatured: true,
    colors: [
      { name: 'Terracota', swatch: '#C06A4E', ambient: '#D78F72' },
      { name: 'Hueso', swatch: '#F2ECE1', ambient: '#DFD5C4', stock: { M: 'pocas' } },
    ],
  },
  {
    slug: 'sueter-salvia',
    name: 'Suéter Salvia',
    headline: 'Tejido que respira',
    description:
      'Punto medio en algodón y lana merino. Cuello redondo acanalado, puños y bajo elásticos. Abriga sin abultar.',
    category: 'sueteres',
    collections: ['tejido', 'esencial'],
    silhouette: 'crewneck',
    basePrice: 189900,
    fit: 'Regular · caída suave',
    material: '70% algodón · 30% lana merino',
    care: 'Lavar a mano en frío o ciclo lana. Secar en plano a la sombra.',
    isFeatured: true,
    colors: [
      { name: 'Salvia', swatch: '#B2C0A8', ambient: '#CED7C5' },
      { name: 'Crema', swatch: '#EFE4CF', ambient: '#DBCCAF', stock: { S: 'pocas', XL: 'agotado' } },
    ],
  },
  {
    slug: 'sueter-nocturno',
    name: 'Suéter Nocturno',
    headline: 'Para cuando baja la luz',
    description:
      'Capucha forrada, cordón plano y bolsillo canguro con apertura lateral. El felpado interior se cepilla para que no apelmace.',
    category: 'sueteres',
    collections: ['nocturno', 'tejido'],
    silhouette: 'hoodie',
    basePrice: 219900,
    compareAtPrice: 259900,
    fit: 'Oversize · capucha estructurada',
    material: '80% algodón · 20% poliéster reciclado, felpa 400 g/m²',
    care: 'Lavar a máquina en frío del revés. No planchar sobre la estampación.',
    isFeatured: true,
    colors: [
      { name: 'Carbón', swatch: '#33363B', ambient: '#1C1E22' },
      { name: 'Vino', swatch: '#6B3742', ambient: '#452229', stock: { XXL: 'agotado' } },
    ],
  },
  {
    slug: 'cardigan-tejido',
    name: 'Cardigan Tejido',
    headline: 'La capa que falta',
    description:
      'Ochos trenzados a lo largo del delantero y botones de corozo. Se lleva abierto sobre cualquier camiseta de la línea.',
    category: 'sueteres',
    collections: ['tejido', 'archivo'],
    silhouette: 'cardigan',
    basePrice: 239900,
    fit: 'Relajado · largo a la cadera',
    material: '60% algodón · 40% alpaca',
    care: 'Lavar a mano en frío. No retorcer. Secar en plano.',
    isFeatured: false,
    colors: [
      { name: 'Camel', swatch: '#C49A6A', ambient: '#E1C49C', stock: { S: 'pocas' } },
      { name: 'Perla', swatch: '#DBD8D3', ambient: '#C2BEB7' },
      {
        name: 'Carbón',
        swatch: '#33363B',
        ambient: '#1C1E22',
        stock: { S: 'agotado', M: 'agotado' },
        priceOverride: { XXL: 249900 },
      },
    ],
  },
];
