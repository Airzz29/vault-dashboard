'use client';

interface TopBarProps {
  title: string;
  breadcrumb?: string;
}

export default function TopBar({ title, breadcrumb }: TopBarProps) {
  return (
    <header className="h-14 border-b border-vault-border bg-vault-bg flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-vault-text">{title}</h1>
        {breadcrumb && (
          <p className="text-xs text-vault-muted">{breadcrumb}</p>
        )}
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="text-vault-muted hover:text-vault-text transition-colors"
          aria-label="Notifications"
        >
          🔔
        </button>
        <div className="w-8 h-8 rounded-full bg-vault-accent/30 border border-vault-accent/50 flex items-center justify-center text-xs font-bold text-vault-text">
          SV
        </div>
      </div>
    </header>
  );
}
