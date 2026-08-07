'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, X, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface UIContextType {
  toast: (message: string, type?: ToastType) => void;
  confirm: (title: string, message: string, onConfirm: () => void) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function useUI() {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within a UIProvider');
  return context;
}

export function UIProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; message: string; type: ToastType }[]>([]);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);

  const toast = (message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const confirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  const handleConfirm = () => {
    if (confirmModal) {
      confirmModal.onConfirm();
      setConfirmModal(null);
    }
  };

  return (
    <UIContext.Provider value={{ toast, confirm }}>
      {children}
      
      {/* Toasts Container */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="animate-slide-up pointer-events-auto bg-surface-container-highest border border-outline-variant text-on-surface shadow-2xl rounded-xl p-4 flex items-center gap-3 min-w-[300px] max-w-[400px]">
            {t.type === 'success' && <CheckCircle2 className="text-emerald-500" size={20} />}
            {t.type === 'error' && <AlertTriangle className="text-error" size={20} />}
            {t.type === 'info' && <Info className="text-primary" size={20} />}
            <span className="text-sm font-medium flex-1">{t.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="text-on-surface-variant hover:text-on-surface transition-colors p-1">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Confirm Modal */}
      {confirmModal?.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-outline-variant rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold font-headline mb-2 text-on-surface">{confirmModal.title}</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
              {confirmModal.message}
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirmModal(null)} 
                className="px-5 py-2.5 rounded-lg text-sm font-bold bg-surface-container-high border border-outline-variant text-on-surface hover:bg-surface-variant transition-colors active:scale-95"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirm} 
                className="px-5 py-2.5 rounded-lg text-sm font-bold bg-primary text-on-primary hover:opacity-90 transition-all active:scale-95 shadow-md hover:shadow-primary/30"
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}
    </UIContext.Provider>
  );
}
