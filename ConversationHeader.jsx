export default function ConversationHeader({ title, subtitle, actionIcon: ActionIcon, onAction, actionDisabled }) {
  return (
    <div className="px-3 py-2.5 border-b border-border flex items-center gap-3 bg-background">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm leading-none truncate">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1 truncate">{subtitle}</p>}
      </div>
      {ActionIcon && onAction && (
        <button onClick={onAction} disabled={actionDisabled} className="w-10 h-10 grid place-items-center rounded-full bg-solar/10 text-solar hover:bg-solar/20 transition shrink-0 active:scale-95 disabled:opacity-50">
          <ActionIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}