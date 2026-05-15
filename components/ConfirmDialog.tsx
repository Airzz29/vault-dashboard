'use client';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  loading,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />
      <div className="relative bg-vault-card border border-vault-border rounded-vault p-6 w-full max-w-sm mx-4 animate-scale-in shadow-xl">
        <h3 className="text-lg font-semibold text-vault-text mb-2">{title}</h3>
        <p className="text-vault-muted text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-vault-border rounded-lg text-vault-muted hover:text-vault-text transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-vault-danger hover:bg-vault-danger/80 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <span className="spinner" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
