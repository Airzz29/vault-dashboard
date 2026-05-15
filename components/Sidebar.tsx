'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  { href: '/dashboard/products', label: 'Products' },
  { href: '/dashboard/dashboard', label: 'Dashboard' },
  { href: '/dashboard/rates', label: 'Rates' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  return (
    <aside className="w-56 min-h-screen bg-vault-card border-r border-vault-border flex flex-col shrink-0">
      <div className="px-5 py-6 border-b border-vault-border">
        <div className="flex items-center gap-2">
          <span className="text-vault-gold text-xl">⚡</span>
          <span className="text-vault-gold font-bold text-lg tracking-wide">
            VAULT
          </span>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-vault-accent/20 text-vault-text border border-vault-accent/30'
                  : 'text-vault-muted hover:text-vault-text hover:bg-vault-border/50'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-vault-border">
        <button
          onClick={handleSignOut}
          className="w-full px-3 py-2 rounded-lg text-sm font-medium text-vault-muted hover:text-vault-danger hover:bg-vault-danger/10 transition-colors text-left"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
