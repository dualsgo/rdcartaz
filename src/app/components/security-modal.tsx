'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type SecurityModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  type: 'error' | 'warning';
  title: string;
  message: string;
};

export function SecurityModal({
  isOpen,
  onClose,
  onConfirm,
  type,
  title,
  message,
}: SecurityModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] animate-in fade-in zoom-in duration-200">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {type === 'error' ? (
              <div className="p-2 bg-destructive/10 rounded-full">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
            ) : (
              <div className="p-2 bg-orange-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            )}
            <DialogTitle className={cn(
              "text-lg font-bold uppercase tracking-tight",
              type === 'error' ? "text-destructive" : "text-orange-600"
            )}>
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-600 font-medium leading-relaxed">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          {type === 'warning' ? (
            <>
              <Button variant="ghost" onClick={onClose} className="font-bold">
                CANCELAR
              </Button>
              <Button 
                onClick={onConfirm} 
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 shadow-lg shadow-orange-600/20"
              >
                SIM, ESTÁ CORRETO
              </Button>
            </>
          ) : (
            <Button onClick={onClose} variant="destructive" className="w-full font-bold">
              ENTENDI
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
