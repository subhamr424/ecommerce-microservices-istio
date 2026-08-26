export function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-ink/50">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-moss-600" />
      <p className="text-sm">{label}…</p>
    </div>
  );
}

export function ErrorState({ message = "Something didn't load." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-white/40 py-16 text-center">
      <p className="font-display text-lg font-semibold text-ink">Couldn't reach the service</p>
      <p className="max-w-sm text-sm text-ink/60">{message}</p>
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line py-20 text-center">
      <p className="font-display text-lg font-semibold text-ink">{title}</p>
      <p className="max-w-sm text-sm text-ink/60">{body}</p>
    </div>
  );
}
