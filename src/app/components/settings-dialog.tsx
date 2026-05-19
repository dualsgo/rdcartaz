'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Database, RotateCcw, Check, Loader2, FileSpreadsheet, CreditCard } from 'lucide-react';
import type { PosterSettings } from '@/app/lib/types';
import { parseReportSemGiro } from '@/app/lib/poster-utils';
import { cn } from '@/lib/utils';

interface SettingsDialogProps {
  settings: PosterSettings;
  onSave: (settings: PosterSettings) => void;
  onOpenDatabase: () => void;
  onImportSessionData?: (data: any[]) => void;
  onClearSessionData?: () => void;
  hasSessionData?: boolean;
}

export function SettingsDialog({ 
  settings, 
  onSave, 
  onOpenDatabase,
  onImportSessionData,
  onClearSessionData,
  hasSessionData 
}: SettingsDialogProps) {
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [maxInstallments, setMaxInstallments] = useState(settings.maxInstallments.toString());
  const [minAmount, setMinAmount] = useState(settings.minInstallmentAmount.toString());

  useEffect(() => {
    setMaxInstallments(settings.maxInstallments.toString());
    setMinAmount(settings.minInstallmentAmount.toString());
  }, [settings]);

  const handleSave = () => {
    onSave({
      maxInstallments: parseInt(maxInstallments, 10) || 6,
      minInstallmentAmount: parseFloat(minAmount) || 29.99,
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('loading');
    try {
      const buffer = await file.arrayBuffer();
      const items = parseReportSemGiro(buffer);
      
      if (items.length > 0) {
        onImportSessionData?.(items);
        setImportStatus('success');
        setTimeout(() => setImportStatus('idle'), 3000);
      } else {
        setImportStatus('error');
        setTimeout(() => setImportStatus('idle'), 3000);
      }
    } catch (err) {
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 3000);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
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
          <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <Settings className="h-5 w-5 text-primary" />
            Configurações do Sistema
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-5 py-4">
          
          {/* Seção de Parcelamento */}
          <div className="p-4 bg-gradient-to-br from-amber-50/40 to-orange-50/20 rounded-xl border border-amber-200/60 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Opções de Parcelamento</h3>
                <p className="text-[0.65rem] text-muted-foreground uppercase font-bold tracking-wider">
                  Regras de parcelamento automático
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="max-installments" className="text-[10px] font-black text-gray-500 uppercase tracking-tight">
                  Qtd Máxima de Parcelas
                </Label>
                <div className="relative">
                  <Input
                    id="max-installments"
                    type="number"
                    min="1"
                    max="24"
                    value={maxInstallments}
                    onChange={(e) => setMaxInstallments(e.target.value)}
                    className="h-10 font-bold focus-visible:ring-orange-500 border-amber-200"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">x</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="min-amount" className="text-[10px] font-black text-gray-500 uppercase tracking-tight">
                  Valor Mínimo da Parcela
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">R$</span>
                  <Input
                    id="min-amount"
                    type="number"
                    step="0.01"
                    min="0.10"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="h-10 pl-8 font-bold focus-visible:ring-orange-500 border-amber-200"
                  />
                </div>
              </div>
            </div>

            {/* Simulação em tempo real */}
            <div className="p-3 bg-white/80 rounded-lg border border-amber-100/60 text-[0.7rem] leading-relaxed text-gray-600 space-y-1">
              <span className="font-bold text-orange-700 block uppercase text-[0.6rem] tracking-wider mb-1">
                Demonstração da Regra Ativa:
              </span>
              <p>
                Um produto de <b>R$ 100,00</b> será parcelado em:
              </p>
              {(() => {
                const maxI = parseInt(maxInstallments, 10) || 6;
                const minA = parseFloat(minAmount) || 29.99;
                
                // Calculando na hora
                const possible = Math.floor(100 / (minA - 0.01));
                const finalI = Math.min(possible, maxI);
                
                if (finalI > 1) {
                  const val = Math.ceil((100 / finalI) * 100) / 100;
                  return (
                    <p className="text-gray-850 font-semibold">
                      👉 <span className="text-orange-600 font-bold">{finalI}x</span> de <span className="font-bold text-gray-900">R$ {val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span> sem juros.
                    </p>
                  );
                } else {
                  return (
                    <p className="text-gray-500 italic">
                      👉 Apenas à vista (o valor da parcela seria menor que R$ {minA.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).
                    </p>
                  );
                }
              })()}
              <p className="text-[0.6rem] text-muted-foreground mt-1.5 italic">
                * Qualquer etiqueta com preço a partir de <b>R$ {(parseFloat(minAmount) * 2).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b> terá parcelamento automático.
              </p>
            </div>
          </div>

          {/* Seção 2: Preços Temporários */}
          <div className={cn(
            "p-4 rounded-xl border transition-all duration-300",
            hasSessionData ? "bg-blue-50/50 border-blue-200" : "bg-muted/50 border-border"
          )}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                  hasSessionData ? "bg-blue-500 text-white" : "bg-primary/10 text-primary"
                )}>
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Preços Temporários</h3>
                  <p className="text-[0.65rem] text-muted-foreground uppercase font-bold tracking-wider">
                    Relatório Sem Giro
                  </p>
                </div>
              </div>
              {hasSessionData && (
                <button 
                  onClick={onClearSessionData}
                  className="p-1.5 rounded-md hover:bg-red-100 text-red-500 transition-colors"
                  title="Limpar preços da sessão"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
            </div>

            <p className="text-[0.75rem] text-muted-foreground mb-4">
              Carregue o relatório para preencher preços automaticamente ao bipar o produto. 
              <span className="block mt-1 font-bold italic text-blue-600/80">Dados válidos apenas para esta sessão.</span>
            </p>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xls,.xlsx"
              className="hidden"
            />

            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={importStatus === 'loading'}
              className={cn(
                "w-full font-bold h-10 transition-all",
                hasSessionData ? "bg-blue-600 hover:bg-blue-700" : "bg-primary"
              )}
            >
              {importStatus === 'loading' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...</> :
               importStatus === 'success' ? <><Check className="mr-2 h-4 w-4" /> Preços Carregados!</> :
               importStatus === 'error'   ? 'Erro ao ler arquivo' :
               hasSessionData ? 'Atualizar Relatório' : 'Carregar Relatório'}
            </Button>
          </div>

          {/* Seção 3: Banco de Dados */}
          <div className="p-4 bg-muted/50 rounded-xl border border-dashed border-border flex flex-col items-center gap-3 text-center">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Banco de Dados de Produtos</h3>
              <p className="text-[0.75rem] text-muted-foreground mt-1">
                Gerencie sua base local de produtos Relíquias.
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

        </div>
        <DialogFooter>
          <DialogTrigger asChild>
            <Button onClick={handleSave} className="w-full font-bold">Salvar e Fechar</Button>
          </DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
