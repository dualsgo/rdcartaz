'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings } from 'lucide-react';
import type { PosterSettings } from '@/app/lib/types';

interface SettingsDialogProps {
  settings: PosterSettings;
  onSave: (settings: PosterSettings) => void;
}

export function SettingsDialog({ settings, onSave }: SettingsDialogProps) {
  const [maxInstallments, setMaxInstallments] = useState(settings.maxInstallments.toString());
  const [minAmount, setMinAmount] = useState(settings.minInstallmentAmount.toString());

  const handleSave = () => {
    onSave({
      maxInstallments: parseInt(maxInstallments) || 1,
      minInstallmentAmount: parseFloat(minAmount.replace(',', '.')) || 1.0,
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all border border-border/50 hover:border-border"
          title="Configurações Padrão"
        >
          <Settings className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Configurar</span>
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
          <div className="grid gap-2">
            <Label htmlFor="max-inst">Máximo de Parcelas (ex: 6x ou 10x)</Label>
            <Input
              id="max-inst"
              type="number"
              value={maxInstallments}
              onChange={(e) => setMaxInstallments(e.target.value)}
              className="font-bold"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="min-amount">Valor Mínimo da Parcela (R$)</Label>
            <Input
              id="min-amount"
              type="text"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="font-bold"
              placeholder="Ex: 30,00"
            />
            <p className="text-[0.7rem] text-muted-foreground">
              O sistema calcula automaticamente o número de parcelas baseado neste valor mínimo.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} className="w-full">Salvar Configurações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
