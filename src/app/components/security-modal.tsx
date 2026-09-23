'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SecurityModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  type: 'error' | 'warning';
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
};

export function SecurityModal({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  type,
  title,
  message,
  confirmText,
  cancelText,
}: SecurityModalProps) {
  // Fecha com a tecla ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (onCancel) onCancel();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onClose();
    if (onConfirm) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCancel();
        }
      }}
    >
      <div 
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200 p-6"
        role="dialog"
        aria-modal="true"
      >
        {/* Botão X para fechar */}
        <button
          type="button"
          onClick={handleCancel}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 mb-4 pr-6">
          {type === 'error' ? (
            <div className="p-2.5 bg-red-100 text-red-600 rounded-full shrink-0">
              <XCircle className="h-6 w-6" />
            </div>
          ) : (
            <div className="p-2.5 bg-orange-100 text-orange-600 rounded-full shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
          )}
          <div>
            <h3 className={cn(
              "text-lg font-bold uppercase tracking-tight leading-snug",
              type === 'error' ? "text-red-600" : "text-orange-600"
            )}>
              {title}
            </h3>
            <p className="mt-2 text-sm text-gray-600 font-medium leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2.5">
          {type === 'warning' ? (
            <>
              <Button 
                type="button"
                variant="ghost" 
                onClick={handleCancel} 
                className="font-bold w-full sm:w-auto h-auto whitespace-normal py-2.5 text-center text-gray-600 hover:text-gray-900"
              >
                {cancelText || 'CANCELAR'}
              </Button>
              <Button 
                type="button"
                onClick={handleConfirm} 
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-5 sm:px-6 shadow-lg shadow-orange-600/20 w-full sm:w-auto h-auto whitespace-normal py-2.5 text-center"
              >
                {confirmText || 'CONFIRMAR'}
              </Button>
            </>
          ) : (
            <Button 
              type="button"
              onClick={handleCancel} 
              variant="destructive" 
              className="w-full font-bold h-auto whitespace-normal py-2.5"
            >
              ENTENDI
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
