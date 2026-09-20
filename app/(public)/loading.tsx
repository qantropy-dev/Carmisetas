/** Esqueleto del escenario mientras llega la prenda. Sin saltos de layout. */
export default function Loading() {
  return (
    <main
      className="flex min-h-[calc(100dvh-var(--nav-h))] animate-pulse flex-col px-5 sm:px-8"
      aria-busy="true"
      aria-label="Cargando"
    >
      <div className="grid flex-1 grid-rows-[auto_minmax(0,1fr)_auto] items-center gap-4 py-4
                      lg:grid-cols-[minmax(240px,1fr)_minmax(0,1.45fr)_minmax(210px,1fr)]
                      lg:grid-rows-[minmax(0,1fr)] lg:gap-8">
        <div className="flex flex-col gap-3">
          <div className="h-2.5 w-24 rounded-full bg-[var(--ambient-hairline)]" />
          <div className="h-10 w-3/4 rounded-lg bg-[var(--ambient-hairline)]" />
          <div className="h-4 w-1/2 rounded-full bg-[var(--ambient-hairline)]" />
        </div>
        <div className="mx-auto h-full w-3/5 rounded-3xl bg-[var(--ambient-hairline)] opacity-60" />
        <div className="flex items-end justify-between gap-4 lg:flex-col lg:items-end">
          <div className="flex gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="size-10 rounded-full bg-[var(--ambient-hairline)]" />
            ))}
          </div>
          <div className="h-9 w-32 rounded-lg bg-[var(--ambient-hairline)]" />
        </div>
      </div>
    </main>
  );
}
