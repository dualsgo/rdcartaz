'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Database, RotateCcw, Check, Loader2, FileSpreadsheet, CreditCard, Zap } from 'lucide-react';
import type { PosterSettings } from '@/app/lib/types';
import { parseReportSemGiro } from '@/app/lib/poster-utils';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const [happyFridayEnabled, setHappyFridayEnabled] = useState(!!settings.happyFridayEnabled);

  useEffect(() => {
    setMaxInstallments(settings.maxInstallments.toString());
    setMinAmount(settings.minInstallmentAmount.toString());
    setHappyFridayEnabled(!!settings.happyFridayEnabled);
  }, [settings]);

  const handleToggleHappyFriday = (checked: boolean) => {
    setHappyFridayEnabled(checked);
    let parsedMax = parseInt(maxInstallments, 10) || 10;
    if (parsedMax !== 6) parsedMax = 10;
    onSave({
      maxInstallments: parsedMax,
      minInstallmentAmount: 29.99,
      happyFridayEnabled: checked,
    });
  };

  const handleSave = () => {
    let parsedMax = parseInt(maxInstallments, 10) || 10;
    if (parsedMax !== 6) parsedMax = 10;

    setMaxInstallments(parsedMax.toString());
    setMinAmount("29.99");

    onSave({
      maxInstallments: parsedMax,
      minInstallmentAmount: 29.99,
      happyFridayEnabled,
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
      <DialogContent className="sm:max-w-[760px] max-h-[92vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <Settings className="h-5 w-5 text-primary" />
            Configurações do Sistema
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2 items-stretch">
          
          {/* COLUNA ESQUERDA: Parcelamento + Campanha Happy Friday */}
          <div className="flex flex-col gap-4">
            {/* Seção Campanha Happy Friday */}
            <div className={cn(
              "p-3.5 rounded-xl border transition-all duration-300 shadow-sm",
              happyFridayEnabled
                ? "bg-zinc-900 text-white border-amber-400/60"
                : "bg-muted/40 border-border"
            )}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                    happyFridayEnabled ? "bg-amber-400 text-zinc-950" : "bg-amber-500/10 text-amber-600"
                  )}>
                    <Zap className="h-4 w-4 fill-current" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={cn("text-sm font-bold leading-tight", happyFridayEnabled ? "text-white" : "text-gray-900")}>
                        Campanha Happy Friday
                      </h3>
                      {happyFridayEnabled && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-400 text-zinc-950 tracking-wider">
                          Ativo
                        </span>
                      )}
                    </div>
                    <p className={cn(
                      "text-[0.65rem] uppercase font-bold tracking-wider mt-0.5",
                      happyFridayEnabled ? "text-amber-300/90" : "text-muted-foreground"
                    )}>
                      Esquenta Black Friday · 4.995 itens
                    </p>
                  </div>
                </div>
                <Switch
                  id="happy-friday-toggle"
                  checked={happyFridayEnabled}
                  onCheckedChange={handleToggleHappyFriday}
                />
              </div>
              <p className={cn(
                "text-[0.7rem] mt-2 leading-snug",
                happyFridayEnabled ? "text-zinc-300" : "text-muted-foreground"
              )}>
                Destaca produtos da campanha na lista e ativa o layout secundário da campanha nos cartazes e etiquetas de vitrine.
              </p>
            </div>

            {/* Seção de Parcelamento */}
            <div className="flex-1 p-4 bg-gradient-to-br from-amber-50/40 to-orange-50/20 rounded-xl border border-amber-200/60 shadow-sm flex flex-col justify-between space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Opções de Parcelamento</h3>
                  <p className="text-[0.65rem] text-muted-foreground uppercase font-bold tracking-wider">
                    Regras de parcelamento automático
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="max-installments" className="text-[10px] font-black text-gray-500 uppercase tracking-tight">
                    Qtd Máxima de Parcelas
                  </Label>
                  <div className="relative">
                    <Select value={maxInstallments} onValueChange={setMaxInstallments}>
                      <SelectTrigger className="h-9 font-bold focus:ring-orange-500 border-amber-200">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10" className="font-bold">10x (Padrão)</SelectItem>
                        <SelectItem value="6" className="font-bold">6x</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="min-amount" className="text-[10px] font-black text-gray-500 uppercase tracking-tight">
                    Valor Mínimo da Parcela
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">R$</span>
                    <Input
                      id="min-amount"
                      type="text"
                      value="29,99"
                      disabled
                      className="h-9 pl-8 font-bold border-amber-200 bg-amber-50/50 text-gray-500 cursor-not-allowed opacity-70"
                    />
                  </div>
                </div>
              </div>

              {/* Simulação em tempo real */}
              <div className="p-2.5 bg-white/80 rounded-lg border border-amber-100/60 text-[0.7rem] leading-relaxed text-gray-600 space-y-0.5">
                <span className="font-bold text-orange-700 block uppercase text-[0.6rem] tracking-wider">
                  Demonstração da Regra Ativa:
                </span>
                <p>
                  Um produto de <b>R$ 100,00</b> será parcelado em:
                </p>
                {(() => {
                  const maxI = parseInt(maxInstallments, 10) || 10;
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
                <p className="text-[0.6rem] text-muted-foreground pt-0.5 italic">
                  * Parcelamento automático a partir de <b>R$ {(parseFloat(minAmount) * 2).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b>.
                </p>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: Preços Temporários + Banco de Dados */}
          <div className="flex flex-col gap-4">
            {/* Seção 2: Preços Temporários */}
            <div className={cn(
              "flex-1 p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between",
              hasSessionData ? "bg-blue-50/50 border-blue-200" : "bg-muted/50 border-border"
            )}>
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0",
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

                <p className="text-[0.72rem] text-muted-foreground mb-3 leading-relaxed">
                  Carregue o relatório para preencher preços automaticamente ao bipar o produto. 
                  <span className="block mt-1 font-bold italic text-blue-600/80">Dados válidos apenas para esta sessão.</span>
                </p>
              </div>

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
                  "w-full font-bold h-9 transition-all",
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
            <div className="p-4 bg-muted/50 rounded-xl border border-dashed border-border flex flex-col justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <Database className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold leading-tight">Banco de Dados de Produtos</h3>
                  <p className="text-[0.7rem] text-muted-foreground mt-0.5">
                    Gerencie sua base local de produtos Relíquias.
                  </p>
                </div>
              </div>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full h-9 font-bold"
                  onClick={onOpenDatabase}
                >
                  Abrir Gerenciador de Dados
                </Button>
              </DialogTrigger>
            </div>
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
