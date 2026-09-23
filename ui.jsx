import { Loader2 } from 'lucide-react';

export function Spinner({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
      <Loader2 className="w-7 h-7 animate-spin text-solar mb-3" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}

export function Empty({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-solar/10 grid place-items-center mb-4">
          <Icon className="w-8 h-8 text-solar" />
        </div>
      )}
      <h3 className="font-display font-semibold text-lg">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PageTitle({ title, subtitle, right, className = '' }) {
  return (
    <div className={`pt-5 pb-3 flex items-start justify-between gap-3 ${className}`}>
      <div>
        <h1 className="font-display font-extrabold text-2xl tracking-tight leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function Card({ children, className = '', onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-border bg-card shadow-md shadow-black/5 ${onClick ? 'cursor-pointer active:scale-[0.99] transition' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({ children, variant = 'default', className = '' }) {
  const styles = {
    default: 'bg-ink text-white',
    solar: 'bg-solar/15 text-solar',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-rose-100 text-rose-700',
    muted: 'bg-muted text-muted-foreground',
    outline: 'border border-border text-foreground',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[variant] || styles.default} ${className}`}>
      {children}
    </span>
  );
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-3xl p-5 shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-full bg-muted text-muted-foreground">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}