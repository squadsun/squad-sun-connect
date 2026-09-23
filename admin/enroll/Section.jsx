export default function Section({ icon: Icon, title, description, children }) {
  return (
    <section className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50 bg-muted/30">
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-solar/15 grid place-items-center shrink-0">
            <Icon className="w-5 h-5 text-solar" />
          </div>
        )}
        <div>
          <h2 className="font-display font-bold text-base">{title}</h2>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </section>
  );
}