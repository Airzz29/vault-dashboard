'use client';

import { ToastProvider } from '@/hooks/useToast';
import ToastContainer from './Toast';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <ToastContainer />
    </ToastProvider>
  );
}
