'use client';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
  closing?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
  closing,
}: ModalProps) {
  if (!isOpen && !closing) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        className={`relative bg-vault-card border border-vault-border rounded-vault w-full ${maxWidth} max-h-[90vh] overflow-y-auto ${
          closing ? 'animate-scale-out' : 'animate-scale-in'
        } max-md:fixed max-md:inset-0 max-md:max-h-full max-md:rounded-none max-md:border-0`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-vault-border sticky top-0 bg-vault-card z-10">
          <h2 className="text-lg font-semibold text-vault-text">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-vault-muted hover:text-vault-text text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
