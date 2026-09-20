/** Slug estable: sin tildes, sin ñ, sin signos. `Suéter Salvia` -> `sueter-salvia`. */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
