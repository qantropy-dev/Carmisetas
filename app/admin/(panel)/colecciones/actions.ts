'use server';

import { revalidatePath } from 'next/cache';
import { fail, ok, zodErrors, type ActionState } from '@/lib/actions';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { taxonomySchema } from '@/lib/validators/product';

function refresh() {
  revalidatePath('/admin/colecciones');
  revalidatePath('/admin/prendas');
  revalidatePath('/', 'layout');
}

export async function saveTaxonomy(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();

  const id = String(fd.get('id') ?? '').trim() || undefined;
  const parsed = taxonomySchema.safeParse({
    ...(id ? { id } : {}),
    entity: String(fd.get('entity') ?? ''),
    name: String(fd.get('name') ?? '').trim(),
    slug: String(fd.get('slug') ?? '').trim(),
  });
  if (!parsed.success) return fail('Revisa los datos', zodErrors(parsed.error.issues));

  const { entity, name, slug } = parsed.data;
  const supabase = await createClient();

  if (id) {
    const { error } = await supabase.from(entity).update({ name, slug }).eq('id', id);
    if (error) return fail(readable(error.message));
  } else {
    const { data: last } = await supabase
      .from(entity)
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = await supabase
      .from(entity)
      .insert({ name, slug, sort_order: (last?.sort_order ?? -1) + 1 });
    if (error) return fail(readable(error.message));
  }

  refresh();
  return ok(id ? 'Guardado' : 'Creado');
}

export async function removeTaxonomy(
  entity: 'categories' | 'collections',
  id: string,
): Promise<ActionState> {
  await requireAdmin();
  const supabase = await createClient();

  // Una categoría con prendas dentro no se borra en silencio: las dejaría
  // huérfanas sin que nadie se entere.
  if (entity === 'categories') {
    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id);
    if ((count ?? 0) > 0) {
      return fail(
        `Esa categoría tiene ${count} ${count === 1 ? 'prenda' : 'prendas'}. Muévelas antes de eliminarla.`,
      );
    }
  }

  const { error } = await supabase.from(entity).delete().eq('id', id);
  if (error) return fail(readable(error.message));
  refresh();
  return ok('Eliminado');
}

function readable(message: string): string {
  if (message.includes('duplicate key')) return 'Ya existe uno con ese enlace.';
  return message;
}
