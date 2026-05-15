'use client';

import { useToast, Toast as ToastItem } from '@/hooks/useToast';

const styles: Record<ToastItem['type'], string> = {
  success: 'border-vault-success/50 bg-vault-success/10 text-vault-success',
  error: 'border-vault-danger/50 bg-vault-danger/10 text-vault-danger',
  warning: 'border-vault-warning/50 bg-vault-warning/10 text-vault-warning',
  info: 'border-vault-accent/50 bg-vault-accent/10 text-vault-text',
};

export default function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto px-4 py-3 rounded-vault border text-sm font-medium shadow-lg animate-[toastIn_0.3s_ease] ${styles[toast.type]}`}
          onClick={() => dismissToast(toast.id)}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
