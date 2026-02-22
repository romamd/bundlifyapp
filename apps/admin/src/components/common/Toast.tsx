import React, { useEffect, useState, useCallback, useRef, createContext, useContext } from 'react';

type ToastVariant = 'success' | 'error' | 'warning';

interface ToastMessage {
  id: number;
  text: string;
  variant: ToastVariant;
  exiting?: boolean;
}

interface ToastContextValue {
  showToast: (text: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const showToast = useCallback((text: string, variant: ToastVariant = 'success') => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, text, variant }]);

    const exitTimer = setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
      const removeTimer = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        timersRef.current.delete(id);
      }, 300);
      timersRef.current.set(id, removeTimer);
    }, 3000);
    timersRef.current.set(id, exitTimer);
  }, []);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  const variantStyles: Record<ToastVariant, React.CSSProperties> = {
    success: { backgroundColor: '#008060', color: '#fff' },
    error: { backgroundColor: '#8c1a1a', color: '#fff' },
    warning: { backgroundColor: '#6a5c00', color: '#fff' },
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              ...variantStyles[toast.variant],
              padding: '10px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              animation: toast.exiting
                ? 'bundlify-toast-out 0.3s ease forwards'
                : 'bundlify-toast-in 0.3s ease',
              pointerEvents: 'auto',
              maxWidth: '360px',
            }}
          >
            {toast.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
