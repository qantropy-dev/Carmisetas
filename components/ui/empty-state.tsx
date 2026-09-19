export function EmptyState({
  title,
  detail,
  children,
}: {
  title: string;
  detail?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-muted/25 px-8 py-14 text-center">
      <h2 className="text-2xl">{title}</h2>
      {detail ? <p className="text-sm leading-relaxed text-muted">{detail}</p> : null}
      {children}
    </div>
  );
}
