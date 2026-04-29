'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Database } from 'lucide-react';
import type { PosterSettings } from '@/app/lib/types';

interface SettingsDialogProps {
  settings: PosterSettings;
  onSave: (settings: PosterSettings) => void;
  onOpenDatabase: () => void;
}

export function SettingsDialog({ settings, onSave, onOpenDatabase }: SettingsDialogProps) {
  const [maxInstallments, setMaxInstallments] = useState(settings.maxInstallments.toString());
  const [minAmount, setMinAmount] = useState(settings.minInstallmentAmount.toString());

  const handleSave = () => {
    onSave({
      maxInstallments: 1,
      minInstallmentAmount: 1.0,
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all border border-border/50 hover:border-border"
          title="Configurações do Sistema"
        >
          <Settings className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Configurações</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações do Sistema
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="p-4 bg-muted/50 rounded-xl border border-dashed border-border flex flex-col items-center gap-3 text-center">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Banco de Dados de Produtos</h3>
              <p className="text-[0.75rem] text-muted-foreground mt-1">
                Gerencie, importe ou exporte sua base local de produtos Relíquias.
              </p>
            </div>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full font-bold"
                onClick={onOpenDatabase}
              >
                Abrir Gerenciador de Dados
              </Button>
            </DialogTrigger>
          </div>

          <div className="px-1">
            <p className="text-[0.7rem] text-muted-foreground italic">
              * O parcelamento automático foi desativado temporariamente nesta versão.
            </p>
          </div>
        </div>
        <DialogFooter>
          <DialogTrigger asChild>
            <Button onClick={handleSave} className="w-full">Fechar</Button>
          </DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
