# RDCartaz (`rdcartaz`) — Estação de Cartazeamento, Campanhas & Fila de Impressão

Sistema de cartazeamento promocional em **Next.js 16 + React 19 + TypeScript**, desenvolvido para operação ágil em loja com **Bipagem Contínua (sem Enter)**, **Assistente de Campanhas** (Ri Happy e PB Kids), **Fila de Impressão em Lote** e pré-visualização em tempo real (Individual e Folha A4 Completa).

---

## Principais Funcionalidades

### 1. Seletor de Bandeira & Assistente de Campanhas
- **Bandeira (`Ri Happy` / `PB Kids`)** no cabeçalho principal: alterna automaticamente o cabeçalho gráfico e os termos legais das campanhas.
- **Assistente de Campanhas (`Ativar Assistente de Campanhas`)**:
  - **Desativado (padrão):** qualquer produto pode gerar os cartazes tradicionais (**Relíquias A4** e **Relíquias A6**).
  - **Ativado:**
    - Filtra o lote carregado por campanha (**Happy/Best Friday**, **Campanha 50%** ou **Regulares**).
    - Na digitação ou bipagem avulsa, identifica automaticamente em qual lista o código se enquadra e exibe apenas os modelos válidos para aquele item, com links diretos para as planilhas oficiais.
    - Herda automaticamente as datas de validade (`DATA INICIO` / `DATA FIM`) cadastradas na base para itens da campanha Happy/Best Friday.

### 2. Modelos e Formatos (`poster-formats.ts`)
- **Cartazes Tradicionais:** `Relíquias A4` (1/folha) e `Relíquias A6` (4/folha) em `poster-preview.tsx`.
- **Campanha 50% OFF (`ESQUENTA_BLACK`):** modelo A5V (`13.6cm × 18.0cm`) em `poster-preview-happy-friday-a5.tsx`, disponível em **A4 (1/folha)**, **A5 (2/folha)** e **A6 (4/folha)**, com fundos dedicados para Ri Happy (`OFERTA-IMP_A5V_343888522_Preview.png`) e PB Kids (`OFERTA_PB_A5V_Preview.png`).
- **Happy Friday / Best Friday (`HAPPY_FRIDAY`):** modelo A6 Vertical (`9.0cm × 13.6cm`) em `poster-preview-happy-friday-a6v.tsx`, disponível em **A4**, **A5** e **A6 (4/folha em A4 Retrato)**, com ampliação automática do DE/POR quando não há parcelamento e bloqueio de fundo caso o item não possua oferta DE/POR válida.
- **Etiquetas de Gôndola & Vitrine (16/folha):** ocultas por padrão; podem ser ativadas a qualquer momento em **Configurações → Modelos de Impressão** (`etiqueta-oficial` e `vitrine`).

### 3. Bipagem Contínua, Busca & Fila em Lote
- **Bipagem Contínua sem Enter (`poster-form.tsx`):** ao carregar o relatório *Preços Temporários (Sem Giro)*, leitores USB adicionam o item direto na fila automaticamente (com suporte a disparo sem sufixo `Enter`, `Tab` ou `Enter`) e devolvem o foco ao campo de busca.
- **Scanner via Câmera (`barcode-scanner.tsx`):** leitura contínua em dispositivos móveis via `html5-qrcode`.
- **Automatização de Planilhas (`automation-modal.tsx` & `/api/produto/bulk-lookup`):** importação de relatórios `.xls` / `.xlsx` / `.csv` com ordenação automática por estoque e filtros por fornecedor, faixa de preço e estoque.
- **Atalhos de Teclado (`use-hotkeys.ts`):** `F2` (buscar), `Alt+1..N` (trocar formato), `Ctrl+Enter` (adicionar ao lote), `Ctrl+P` (imprimir), `Esc` (limpar).

---

## Stack Tecnológica

- **Framework:** Next.js 16 (App Router / Turbopack), React 19, TypeScript 5
- **UI & Tipografia:** Tailwind CSS, Radix UI / shadcn/ui, Lucide React, fontes **Roboto**, **Gotham** e **Century Gothic (`GOTHICB` / `GOTHICBI`)**
- **Utilitários:** `xlsx`, `html5-qrcode`, React Hook Form, Zod

---

## Estrutura do Projeto

```text
rdcartaz/
├── data/
│   ├── produtos.json               # Dicionário indexado de produtos (SAP / EAN + campanhas)
│   └── basedados.json              # Base completa de produtos e campanhas
├── public/
│   ├── backgrounds/                # Fundos oficiais (Relíquias, Ofertas PB/RH, Happy/Best Friday)
│   └── fonts/                      # Fontes Gotham e Century Gothic (GOTHICB / GOTHICBI)
├── scripts/                        # Scripts utilitários de indexação e conversão
├── src/
│   ├── app/
│   │   ├── api/produto/            # Endpoints de busca, suggest, bulk-lookup e stats
│   │   ├── components/             # Formulário, Previews, Fila, Scanner e Configurações
│   │   └── lib/                    # Definições de formatos (poster-formats.ts), tipos e parsers
│   ├── components/ui/              # Componentes shadcn/ui
│   └── hooks/                      # Hooks customizados (use-hotkeys, use-toast, etc.)
├── next.config.ts                  # Configurações e cabeçalhos HTTP de segurança
└── package.json
```

---

## Como Executar

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (porta 9002)
npm run dev

# Validar tipagem TypeScript
npm run typecheck

# Gerar build de produção
npm run build
```

---

## Segurança & Higiene do Repositório

- **Cabeçalhos HTTP de Segurança (`next.config.ts`):** `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin` e `Permissions-Policy` restritiva (`camera=(self)` apenas para o scanner).
- **Validação de API:** parâmetros de busca validados por regex e limites de tamanho em `/api/produto` e `/api/produto/bulk-lookup` (limite de chaves, tamanho de payload e proteção contra acesso a propriedades de protótipo via `Object.prototype.hasOwnProperty`).
- **Higiene:** planilhas temporárias de loja (`.xls` / `.xlsx`) são ignoradas pelo `.gitignore` e relatórios antigos/CSVs já importados foram removidos da raiz.
