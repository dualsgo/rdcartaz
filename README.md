# 🏷️ RDCartaz (`rdcartaz`) — Estação Avançada de Cartazeamento, Filas de Impressão & Etiquetas

Evolução completa do sistema de cartazeamento promocional em **Next.js 16 + React 19 + TypeScript**, adicionando **Fila de Impressão em Lote (`queue-panel.tsx`)**, **Seletor Multi-Formato (`format-selector.tsx`)**, **Atalhos de Teclado (`use-hotkeys.ts`)**, **Fundos Temáticos (`oferta-a4v-bg.png`, `reliquias-bg.png`)** e **Consulta em Lote (`/api/produto/bulk-lookup`)**.

---

## 🚀 Principais Diferenciais e Funcionalidades

### 1. 🗂️ Fila de Impressão e Processamento em Lote
- **Painel de Fila (`queue-panel.tsx` & `print-preview.tsx`)**: Adicione dezenas de produtos na fila de impressão, revise todos os cartazes simultaneamente e imprima o lote inteiro de uma só vez.
- **Importação de Planilhas Promocionais (`import-modal.tsx` & `/api/produto/bulk-lookup`)**: Importação direta de relatórios de promoção/estoque (`.xls` / `.xlsx`) com cruzamento automático na base de produtos.

### 2. 🎨 Formatos e Templates Oficiais (`poster-formats.ts`)
- **Cartaz A4 Vertical / Horizontal com Background Oficial (`oferta-a4v-bg.png` e `reliquias-bg.png`)**
- **Cartaz Aéreo (`poster-preview-aereo.tsx`)**
- **Cartaz Vitrine (`poster-preview-vitrine.tsx`)**
- **Cartaz Totem (`poster-preview-totem.tsx`)**
- **Etiqueta Oficial com Código de Barras (`poster-preview-etiqueta-oficial.tsx`)**

### 3. 🔍 Busca Instantânea, Scanner e Atalhos Rápidos
- **Base Indexada de Produtos (`data/produtos.json`)**: Autocomplete por código SAP, código de barras EAN-13 ou nome do produto.
- **Scanner de Código de Barras (`barcode-scanner.tsx`)**: Leitura via câmera (`html5-qrcode`) ou leitor USB.
- **Atalhos de Produtividade (`use-hotkeys.ts`)**: Navegação rápida por teclado para operação ágil em loja.

---

## 🛠️ Stack Tecnológica

- **Framework**: Next.js 16, React 19, TypeScript 5
- **UI & Fontes**: Tailwind CSS, Radix UI / shadcn/ui, Lucide React, fontes corporativas **Gotham** e **Century Gothic**
- **Bibliotecas**: `xlsx`, `html5-qrcode`, React Hook Form, Zod

---

## 📂 Estrutura do Projeto

```text
rdcartaz/
├── data/
│   └── produtos.json               # Dicionário indexado de produtos (SAP / EAN)
├── public/
│   ├── backgrounds/                # Templates gráficos de fundo (Oferta e Relíquias)
│   └── fonts/                      # Fontes Gotham e Gothic
├── scripts/                        # Scripts utilitários de indexação da base
├── src/
│   ├── app/
│   │   ├── api/                    # Rotas de busca unitária, bulk-lookup, suggest e stats
│   │   ├── components/             # Formulário, Fila de Impressão, Previews, Scanner e Configurações
│   │   └── lib/                    # Definições de formatos (poster-formats.ts) e utilitários
│   ├── components/ui/              # Componentes shadcn/ui (incluindo Kbd para atalhos)
│   └── hooks/                      # Hooks customizados (use-hotkeys, useScaleFactor, use-toast)
└── package.json
```

---

## 💻 Como Executar

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (porta 9002)
npm run dev

# Gerar build de produção
npm run build
```

---

## 🔒 Privacidade e Higiene do Repositório
Planilhas de relatórios promocionais com estoque (`.xls`), arquivos `.tsv` brutos e capturas de treinamento (`scratch/`) foram removidos do repositório.
