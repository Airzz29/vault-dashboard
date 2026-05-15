'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const navItems = [
  { href: '/dashboard/products', label: 'Products', icon: '📦' },
  { href: '/dashboard/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/dashboard/rates', label: 'Rates', icon: '💱' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const check = () => setCollapsed(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  return (
    <aside
      className={`${collapsed ? 'w-16' : 'w-[220px]'} min-h-screen bg-vault-card border-r border-vault-border flex flex-col shrink-0 transition-all duration-300`}
    >
      <div className={`${collapsed ? 'px-3' : 'px-5'} py-6 border-b border-vault-border`}>
        <div className={`flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}>
          <span className="text-vault-gold text-xl animate-float">⚡</span>
          {!collapsed && (
            <span className="text-vault-gold font-bold text-lg tracking-wide">
              VAULT
            </span>
          )}
        </div>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item, i) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              style={{ animationDelay: `${i * 50}ms` }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 animate-slide-in ${
                active
                  ? 'bg-[#1a0a3b] border-l-[3px] border-vault-accent text-white pl-[9px]'
                  : 'text-vault-muted hover:bg-vault-card-hover hover:text-white border-l-[3px] border-transparent'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <span>{item.icon}</span>
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-2 py-4 border-t border-vault-border">
        <div className={`flex items-center gap-3 mb-3 ${collapsed ? 'justify-center' : 'px-2'}`}>
          <div className="w-8 h-8 rounded-full bg-vault-accent/40 flex items-center justify-center text-xs font-bold text-vault-text shrink-0">
            SV
          </div>
          {!collapsed && (
            <span className="text-sm text-vault-muted">StreetVault</span>
          )}
        </div>
        <button
          onClick={handleSignOut}
          className={`w-full px-3 py-2 rounded-lg text-sm font-medium text-vault-muted hover:text-vault-danger hover:bg-vault-danger/10 transition-colors text-left ${collapsed ? 'text-center' : ''}`}
        >
          {collapsed ? '↪' : 'Sign Out'}
        </button>
      </div>
    </aside>
  );
}
