'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Database, X, Search, Pencil, Trash2, Plus, Check, XCircle, Loader2, ChevronLeft, ChevronRight, AlertTriangle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { parseDatabaseImportExcel } from '@/app/lib/poster-utils';

type ProdutoItem = {
  key: string;
  description: string;
  reference: string;
  ean?: string;
  code?: string;
};

type ListResponse = {
  total: number;
  page: number;
  limit: number;
  items: ProdutoItem[];
};

/* ── Empty form ── */
const emptyForm = () => ({ description: '', ean: '', code: '', reference: '' });

/* ══════════════════════════════════════════════════════════════
   DatabasePanel — painel deslizante de gerenciamento do banco
   ══════════════════════════════════════════════════════════════ */
export function DatabasePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [search, setSearch]         = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage]             = useState(1);
  const [data, setData]             = useState<ListResponse | null>(null);
  const [loading, setLoading]       = useState(false);

  // Novo produto
  const [addOpen, setAddOpen]       = useState(false);
  const [addForm, setAddForm]       = useState(emptyForm);
  const [addStatus, setAddStatus]   = useState<'idle' | 'saving' | 'ok' | 'err'>('idle');
  const [addError, setAddError]     = useState('');

  // Edição inline
  const [editKey, setEditKey]       = useState<string | null>(null);
  const [editForm, setEditForm]     = useState(emptyForm);
  const [editStatus, setEditStatus] = useState<'idle' | 'saving' | 'ok' | 'err'>('idle');
  const [editError, setEditError]   = useState('');

  // Exclusão
  const [deleteKey, setDeleteKey]   = useState<string | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'deleting'>('idle');

  // Importação em Lote
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [importCount, setImportCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Debounce do search ── */
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
  }, [search]);

  /* ── Fetch listagem ── */
  const fetchList = useCallback(async (p: number, s: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/produto?list=1&page=${p}&search=${encodeURIComponent(s)}`);
      const json = await res.json() as ListResponse;
      setData(json);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchList(page, debouncedSearch);
  }, [open, page, debouncedSearch, fetchList]);

  /* ── Resetar ao fechar ── */
  useEffect(() => {
    if (!open) {
      setSearch('');
      setDebouncedSearch('');
      setPage(1);
      setData(null);
      setAddOpen(false);
      setEditKey(null);
      setDeleteKey(null);
    }
  }, [open]);

  /* ── Adicionar produto ── */
  const handleAdd = async () => {
    const key = addForm.code.trim() || addForm.ean.trim();
    if (!key || !addForm.description.trim()) return;
    setAddStatus('saving');
    setAddError('');
    try {
      const res = await fetch('/api/produto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          description: addForm.description,
          reference: addForm.reference || undefined,
          ean: addForm.ean || undefined,
          code: addForm.code || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setAddStatus('err'); setAddError(json.error ?? 'Erro ao salvar.'); return; }
      setAddStatus('ok');
      setAddForm(emptyForm());
      setAddOpen(false);
      fetchList(1, debouncedSearch);
      setPage(1);
      setTimeout(() => setAddStatus('idle'), 2000);
    } catch {
      setAddStatus('err');
      setAddError('Erro de conexão.');
    }
  };

  /* ── Editar produto ── */
  const startEdit = (item: ProdutoItem) => {
    setEditKey(item.key);
    setEditForm({ description: item.description, ean: item.ean ?? '', code: item.code ?? '', reference: item.reference ?? '' });
    setEditStatus('idle');
    setEditError('');
    setDeleteKey(null);
  };

  const handleEdit = async () => {
    if (!editKey) return;
    setEditStatus('saving');
    setEditError('');
    try {
      const res = await fetch('/api/produto', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: editKey,
          description: editForm.description || undefined,
          reference: editForm.reference || undefined,
          ean: editForm.ean || undefined,
          code: editForm.code || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setEditStatus('err'); setEditError(json.error ?? 'Erro ao salvar.'); return; }
      setEditStatus('ok');
      fetchList(page, debouncedSearch);
      setTimeout(() => { setEditKey(null); setEditStatus('idle'); }, 1200);
    } catch {
      setEditStatus('err');
      setEditError('Erro de conexão.');
    }
  };

  /* ── Excluir produto ── */
  const handleDelete = async (key: string) => {
    setDeleteStatus('deleting');
    try {
      const res = await fetch(`/api/produto?key=${encodeURIComponent(key)}`, { method: 'DELETE' });
      if (!res.ok) { setDeleteStatus('idle'); return; }
      setDeleteKey(null);
      setDeleteStatus('idle');
      fetchList(page, debouncedSearch);
    } catch {
      setDeleteStatus('idle');
    }
  };

  /* ── Importação em Lote ── */
  const handleBatchImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('loading');
    try {
      const buffer = await file.arrayBuffer();
      const items = parseDatabaseImportExcel(buffer);
      
      if (items.length === 0) {
        setImportStatus('error');
        setTimeout(() => setImportStatus('idle'), 3000);
        return;
      }

      const res = await fetch('/api/produto', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      if (!res.ok) throw new Error('Falha no upload');

      const json = await res.json();
      setImportCount(json.count || items.length);
      setImportStatus('success');
      fetchList(1, '');
      setPage(1);
      setTimeout(() => setImportStatus('idle'), 4000);
    } catch (err) {
      console.error(err);
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 3000);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / (data.limit || 50))) : 1;

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Painel lateral */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl flex flex-col bg-background border-l border-border shadow-2xl animate-in slide-in-from-right duration-250">

        {/* ── Header do painel ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-card shrink-0">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-lg">Banco de Dados</h2>
            {data && (
              <span className="ml-2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-mono">
                {data.total.toLocaleString('pt-BR')} produto{data.total !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleBatchImport}
              accept=".xls,.xlsx"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importStatus === 'loading'}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all border',
                importStatus === 'success' ? 'bg-green-500/10 text-green-600 border-green-200' :
                importStatus === 'error'   ? 'bg-red-500/10 text-red-600 border-red-200' :
                'bg-muted hover:bg-primary/10 hover:text-primary border-border'
              )}
            >
              {importStatus === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> :
               importStatus === 'success' ? <Check className="h-4 w-4" /> :
               importStatus === 'error'   ? <XCircle className="h-4 w-4" /> :
               <Upload className="h-4 w-4" />}
              {importStatus === 'loading' ? 'Importando...' :
               importStatus === 'success' ? `${importCount} Itens!` :
               importStatus === 'error'   ? 'Erro' :
               'Importar Lote'}
            </button>
            <button
              onClick={() => { setAddOpen(v => !v); setEditKey(null); setDeleteKey(null); }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all',
                addOpen
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-primary/10 hover:text-primary border border-border'
              )}
            >
              <Plus className="h-4 w-4" />
              Novo Produto
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ── Formulário de adição ── */}
        {addOpen && (
          <div className="shrink-0 border-b bg-primary/5 border-primary/20 px-5 py-4 space-y-3 animate-in slide-in-from-top duration-200">
            <p className="text-xs font-bold text-primary uppercase tracking-wide">Adicionar Novo Produto</p>
            <div className="space-y-1">
              <Label htmlFor="add-desc" className="text-xs text-muted-foreground">Descrição *</Label>
              <Input
                id="add-desc"
                value={addForm.description}
                onChange={e => setAddForm(f => ({ ...f, description: e.target.value.toUpperCase() }))}
                placeholder="NOME DO PRODUTO"
                className="uppercase text-sm"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label htmlFor="add-code" className="text-xs text-muted-foreground">Cód. SAP</Label>
                <Input
                  id="add-code"
                  value={addForm.code}
                  onChange={e => setAddForm(f => ({ ...f, code: e.target.value.replace(/\D/g, '') }))}
                  placeholder="71838"
                  inputMode="numeric"
                  className="text-sm font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="add-ean" className="text-xs text-muted-foreground">EAN</Label>
                <Input
                  id="add-ean"
                  value={addForm.ean}
                  onChange={e => setAddForm(f => ({ ...f, ean: e.target.value.replace(/\D/g, '') }))}
                  placeholder="7891234567890"
                  inputMode="numeric"
                  className="text-sm font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="add-ref" className="text-xs text-muted-foreground">Referência</Label>
                <Input
                  id="add-ref"
                  value={addForm.reference}
                  onChange={e => setAddForm(f => ({ ...f, reference: e.target.value }))}
                  placeholder="ABC-123"
                  className="text-sm"
                />
              </div>
            </div>
            {addError && <p className="text-xs text-destructive flex items-center gap-1"><XCircle className="h-3.5 w-3.5" />{addError}</p>}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setAddOpen(false); setAddForm(emptyForm()); setAddError(''); }}
                className="flex-1 rounded-lg border border-border text-sm font-medium py-2 hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdd}
                disabled={addStatus === 'saving' || (!addForm.code && !addForm.ean) || !addForm.description}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold py-2 hover:bg-primary/90 disabled:opacity-40 transition-colors"
              >
                {addStatus === 'saving' ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</> :
                 addStatus === 'ok'     ? <><Check className="h-4 w-4" /> Salvo!</> :
                 <><Plus className="h-4 w-4" /> Adicionar</>}
              </button>
            </div>
          </div>
        )}

        {/* ── Barra de busca ── */}
        <div className="shrink-0 px-5 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por SAP, EAN, descrição…"
              className="pl-9 h-10"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── Lista de produtos ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 pb-4">
          {loading && (
            <div className="flex justify-center items-center py-16 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Carregando...</span>
            </div>
          )}

          {!loading && data && data.items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Database className="h-8 w-8 opacity-30" />
              <p className="text-sm">Nenhum produto encontrado.</p>
            </div>
          )}

          {!loading && data && data.items.length > 0 && (
            <div className="divide-y divide-border/50 rounded-lg border border-border overflow-hidden mt-1">
              {data.items.map(item => {
                const isEditing  = editKey  === item.key;
                const isDeleting = deleteKey === item.key;

                return (
                  <div key={item.key} className="bg-card">
                    {/* ── Row ── */}
                    {!isEditing && !isDeleting && (
                      <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors group">
                        <span className="font-mono text-xs text-muted-foreground w-16 shrink-0">{item.key}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate leading-tight">{item.description}</p>
                          <div className="flex gap-3 mt-0.5 flex-wrap">
                            {item.ean  && <span className="text-[10px] text-muted-foreground font-mono">EAN: {item.ean}</span>}
                            {item.reference && item.reference !== item.key && (
                              <span className="text-[10px] text-muted-foreground">Ref: {item.reference}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => startEdit(item)}
                            className="p-1.5 rounded-md hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground"
                            title="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => { setDeleteKey(item.key); setEditKey(null); }}
                            className="p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
                            title="Excluir"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── Inline Edit ── */}
                    {isEditing && (
                      <div className="px-4 py-3 bg-primary/5 border-l-2 border-primary space-y-2 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-bold text-primary uppercase tracking-wide">Editando: <span className="font-mono">{item.key}</span></p>
                          <button onClick={() => setEditKey(null)} className="text-muted-foreground hover:text-foreground">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Descrição</Label>
                          <Input
                            value={editForm.description}
                            onChange={e => setEditForm(f => ({ ...f, description: e.target.value.toUpperCase() }))}
                            className="text-sm uppercase"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Cód. SAP</Label>
                            <Input
                              value={editForm.code}
                              onChange={e => setEditForm(f => ({ ...f, code: e.target.value.replace(/\D/g, '') }))}
                              className="text-sm font-mono"
                              inputMode="numeric"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">EAN</Label>
                            <Input
                              value={editForm.ean}
                              onChange={e => setEditForm(f => ({ ...f, ean: e.target.value.replace(/\D/g, '') }))}
                              className="text-sm font-mono"
                              inputMode="numeric"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Referência</Label>
                            <Input
                              value={editForm.reference}
                              onChange={e => setEditForm(f => ({ ...f, reference: e.target.value }))}
                              className="text-sm"
                            />
                          </div>
                        </div>
                        {editError && <p className="text-xs text-destructive flex items-center gap-1"><XCircle className="h-3.5 w-3.5" />{editError}</p>}
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => setEditKey(null)}
                            className="flex-1 rounded-lg border border-border text-xs font-medium py-1.5 hover:bg-muted transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleEdit}
                            disabled={editStatus === 'saving'}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold py-1.5 hover:bg-primary/90 disabled:opacity-40 transition-colors"
                          >
                            {editStatus === 'saving' ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Salvando...</> :
                             editStatus === 'ok'     ? <><Check className="h-3.5 w-3.5" />Salvo!</> :
                             <><Check className="h-3.5 w-3.5" />Salvar</>}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── Confirm Delete ── */}
                    {isDeleting && (
                      <div className="px-4 py-3 bg-destructive/5 border-l-2 border-destructive flex items-center gap-3 animate-in fade-in duration-150">
                        <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-destructive">Excluir produto?</p>
                          <p className="text-[10px] text-muted-foreground truncate">{item.description}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => setDeleteKey(null)}
                            className="px-2.5 py-1 rounded-md border border-border text-xs font-medium hover:bg-muted transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleDelete(item.key)}
                            disabled={deleteStatus === 'deleting'}
                            className="px-2.5 py-1 rounded-md bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 disabled:opacity-50 transition-colors flex items-center gap-1"
                          >
                            {deleteStatus === 'deleting' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                            Excluir
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Paginação ── */}
        {data && totalPages > 1 && (
          <div className="shrink-0 flex items-center justify-between px-5 py-3 border-t bg-muted/20">
            <span className="text-xs text-muted-foreground">
              Página {page} de {totalPages} · {data.total.toLocaleString('pt-BR')} itens
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
