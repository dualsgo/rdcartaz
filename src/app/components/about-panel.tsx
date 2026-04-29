'use client';

import { X, AlertTriangle, Database, Sparkles, Info, ShieldAlert, ExternalLink } from 'lucide-react';

interface AboutPanelProps {
  open: boolean;
  onClose: () => void;
}

export function AboutPanel({ open, onClose }: AboutPanelProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(148,163,184,0.15)' }}
      >
        {/* Header */}
        <div
          className="shrink-0 px-6 py-4 flex items-center justify-between"
          style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Info className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">Sobre o Gerador de Cartazes</h2>
              <p className="text-slate-400 text-xs">Ferramenta auxiliar não oficial</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors rounded-full p-1.5 hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">

          {/* Aviso principal */}
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            <div className="flex gap-3 items-start">
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-red-300 font-bold text-sm mb-1.5">Distribuição Não Oficial</p>
                <p className="text-red-200/80 text-xs leading-relaxed">
                  Esta ferramenta <strong className="text-red-200">não é distribuída nem homologada</strong> pela
                  empresa. Foi desenvolvida por um lojista como solução paliativa após mudanças no sistema oficial
                  de geração de cartazes. Use com responsabilidade.
                </p>
              </div>
            </div>
          </div>

          {/* Origem */}
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <p className="text-slate-300 font-semibold text-sm mb-2 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-indigo-500/20 flex items-center justify-center shrink-0">
                <Info className="h-3 w-3 text-indigo-400" />
              </span>
              Origem e Propósito
            </p>
            <p className="text-slate-400 text-xs leading-relaxed">
              Com a mudança no sistema oficial da empresa, a geração de cartazes ficou comprometida. Esta ferramenta
              nasceu como <strong className="text-white">interface gráfica auxiliar para a Planilha de Relíquias da Diversão</strong>,
              permitindo gerar cartazes de forma prática enquanto o sistema oficial não é normalizado.
            </p>
          </div>

          {/* Modelos e IA */}
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <p className="text-slate-300 font-semibold text-sm mb-2 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-purple-500/20 flex items-center justify-center shrink-0">
                <Sparkles className="h-3 w-3 text-purple-400" />
              </span>
              Modelos de Cartaz e Uso de IA
            </p>
            <p className="text-slate-400 text-xs leading-relaxed mb-2">
              Os modelos foram desenvolvidos com auxílio de <strong className="text-white">Inteligência Artificial</strong>,
              buscando replicar fielmente os cartazes oficiais da empresa. Em alguns casos, foram feitos ajustes
              de layout baseados em <strong className="text-white">boas práticas de design</strong> e na experiência
              prática do dia a dia da loja.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {[
                { label: 'Relíquias', desc: 'Réplica do modelo oficial' },
                { label: 'Imperdíveis', desc: 'Réplica do modelo oficial' },
                { label: 'Avarias', desc: 'Modelo adaptado para ponta de estoque com defeito' },
                { label: 'Aéreo', desc: 'Modelo para cartazes de prateleira/aéreo' },
                { label: 'Gôndola', desc: '16 etiquetas por folha A4' },
                { label: 'Totem', desc: 'Cartaz A4 vertical de destaque' },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-lg px-3 py-2"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <p className="text-white text-xs font-semibold">{m.label}</p>
                  <p className="text-slate-500 text-[10px] leading-tight mt-0.5">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Banco de dados */}
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)' }}
          >
            <p className="text-green-300 font-semibold text-sm mb-1.5 flex items-center gap-2">
              <Database className="h-4 w-4 text-green-400" />
              Banco de Dados
            </p>
            <p className="text-slate-400 text-xs leading-relaxed">
              O acervo de produtos utilizado é o <strong className="text-white">mesmo disponibilizado oficialmente</strong> pela
              empresa na Planilha de Relíquias da Diversão, contendo{' '}
              <strong className="text-green-400 text-sm">141.131 produtos cadastrados</strong>.
              Nenhuma informação foi alterada, removida ou adicionada ao banco de dados original.
            </p>
          </div>

          {/* Aviso de preço */}
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}
          >
            <div className="flex gap-3 items-start">
              <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-300 font-bold text-sm mb-1.5">⚠️ Digitação Manual — Atenção Redobrada</p>
                <p className="text-amber-200/70 text-xs leading-relaxed">
                  Diferente do sistema oficial, os <strong className="text-amber-200">preços e descontos são inseridos manualmente</strong>.
                  Um erro de digitação pode resultar em cartazes com valores incorretos, expondo a loja a vendas
                  com <strong className="text-amber-200">preços abaixo do custo ou descontos indevidos</strong>.
                  <br /><br />
                  <span className="text-white">Sempre revise o cartaz na tela antes de imprimir.</span>
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div
          className="shrink-0 px-6 py-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.2)' }}
        >
          <p className="text-slate-500 text-[10px] text-center leading-relaxed">
            Desenvolvido por um lojista para uso interno · Não distribuído pela empresa ·
            Banco de dados: Planilha Relíquias da Diversão (oficial)
          </p>
        </div>
      </div>
    </div>
  );
}
