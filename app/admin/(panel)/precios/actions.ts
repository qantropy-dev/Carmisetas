'use server';

import { revalidatePath } from 'next/cache';
import { fail, ok, zodErrors, type ActionState } from '@/lib/actions';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { applyBulkPrice, bulkPriceSchema, type BulkPriceInput } from '@/lib/validators/product';

export type PricePreviewRow = {
  id: string;
  name: string;
  before: number;
  after: number;
  compareBefore: number | null;
  compareAfter: number | null;
};

export type PreviewResult = { rows: PricePreviewRow[]; error: string | null };

async function affected(rule: BulkPriceInput) {
  const supabase = await createClient();
  let query = supabase
    .from('products')
    .select('id, name, base_price, compare_at_price')
    .order('sort_order');

  if (rule.scope === 'categoria' && rule.category_id) query = query.eq('category_id', rule.category_id);
  if (rule.scope === 'seleccion') query = query.in('id', rule.product_ids);

  return query;
}

/**
 * Calcula el resultado SIN escribir nada. `applyBulkPrice` es puro y
 * determinista, así que al confirmar sale exactamente lo previsualizado.
 */
export async function previewBulkPrice(input: BulkPriceInput): Promise<PreviewResult> {
  await requireAdmin();
  const parsed = bulkPriceSchema.safeParse(input);
  if (!parsed.success) {
    return { rows: [], error: parsed.error.issues[0]?.message ?? 'Revisa la regla' };
  }

  const { data, error } = await affected(parsed.data);
  if (error) return { rows: [], error: error.message };

  const rule = parsed.data;
  const rows = (data ?? []).map((p) => {
    const after = applyBulkPrice(p.base_price, rule);
    // Mantener el descuento mueve el tachado en la misma proporción, y lo
    // redondea igual que el precio: un tachado de $ 107.897 delata la fórmula.
    let compareAfter = p.compare_at_price;
    if (rule.keep_discount && p.compare_at_price !== null && p.base_price > 0) {
      const scaled = (p.compare_at_price / p.base_price) * after;
      const rounded =
        rule.round_to > 0
          ? Math.round(scaled / rule.round_to) * rule.round_to
          : Math.round(scaled);
      // El tachado siempre por encima del precio, o la base lo rechaza.
      compareAfter = Math.max(after + (rule.round_to || 1), rounded);
    }

    return {
      id: p.id,
      name: p.name,
      before: p.base_price,
      after,
      compareBefore: p.compare_at_price,
      compareAfter,
    };
  });

  return { rows, error: null };
}

export async function applyBulkPricing(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();

  let raw: unknown;
  try {
    raw = JSON.parse(String(fd.get('rule') ?? ''));
  } catch {
    return fail('No se entendió la regla');
  }

  const parsed = bulkPriceSchema.safeParse(raw);
  if (!parsed.success) return fail('Revisa la regla', zodErrors(parsed.error.issues));

  const preview = await previewBulkPrice(parsed.data);
  if (preview.error) return fail(preview.error);
  if (preview.rows.length === 0) return fail('Ninguna prenda entra en esa regla');

  const supabase = await createClient();
  // Fila a fila: así el trigger de auditoría deja un registro por prenda y el
  // historial dice exactamente qué precio cambió y a cuánto.
  const results = await Promise.all(
    preview.rows
      .filter((row) => row.after !== row.before || row.compareAfter !== row.compareBefore)
      .map((row) =>
        supabase
          .from('products')
          .update({ base_price: row.after, compare_at_price: row.compareAfter })
          .eq('id', row.id),
      ),
  );

  const broken = results.find((r) => r.error);
  if (broken?.error) return fail(`No se aplicó todo: ${broken.error.message}`);

  revalidatePath('/admin/prendas');
  revalidatePath('/admin/precios');
  revalidatePath('/', 'layout');

  const changed = results.length;
  return ok(
    changed === 0
      ? 'No hubo nada que cambiar'
      : `${changed} ${changed === 1 ? 'precio actualizado' : 'precios actualizados'}`,
  );
}
