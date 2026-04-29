# 🏷️ RD Cartaz — Interface Web

Esta é uma interface web desenvolvida para a planilha **RD Cartaz**, utilizada como uma solução paliativa e eficiente para a geração e impressão de cartazes promocionais. O objetivo é oferecer uma alternativa mais ágil e visual ao uso direto de planilhas.

Atualmente suporta dois modelos principais da loja **Ri Happy**: **Relíquias de Diversão** (folha A4 paisagem, 2×2) e **Aéreo** (folha A4 retrato, fixado em altura elevada).

---

## ✨ Funcionalidades

### Modelo Relíquias de Diversão
- **4 cartazes** por folha A4 paisagem dispostos em **grade 2×2**
- Cada cartaz editado individualmente nas abas 1–4
- Exibição do desconto percentual em destaque (bloco preto)
- Preço DE (riscado) + POR em tipografia grande
- Suporte a parcelamento em até 6×
- Campos: Descrição, Preço DE, Preço POR, EAN/SAP, Referência

### Modelo Aéreo
- **2 cartazes** por folha A4 retrato
- Design de alto impacto visual para leitura à distância (produtos em prateleiras altas)
- Coluna esquerda: cabeçalho OFERTAS/RI HAPPY + descrição + preço DE
- Coluna direita: fundo preto contrastante com desconto % e preço POR em tamanho gigante
- Modos: **Oferta** (com campo DE e cálculo de desconto) e **Preço Normal**

### Geral
- **Pré-visualização em tempo real** — muda ao trocar de aba
- **Impressão fiel** via `window.print()` com `@media print` dedicado
- Layout sem barra de rolagem — interface preenche 100% da viewport
- Orientação de página ajustada automaticamente conforme o modelo

---

## 🚀 Rodando localmente

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (porta 9002)
npm run dev
```

Acesse: [http://localhost:9002](http://localhost:9002)

```bash
# Build de produção
npm run build
npm start

# Checagem de tipos
npm run typecheck

# Lint
npm run lint
```

---

## 🗂️ Estrutura do Projeto

```
src/
├── app/
│   ├── components/
│   │   ├── poster-form.tsx          # Formulário de edição do cartaz
│   │   ├── poster-preview.tsx       # Pré-visualização — Relíquias (A4 paisagem)
│   │   ├── poster-preview-aereo.tsx # Pré-visualização — Aéreo (A4 retrato)
│   │   ├── ofertas-header.tsx       # SVG decorativo "OFERTAS"
│   │   └── ri-happy-header.tsx      # SVG decorativo "RI HAPPY"
│   ├── lib/
│   │   └── types.ts                 # Tipo PosterData
│   ├── globals.css                  # Estilos globais + @media print
│   ├── layout.tsx                   # Layout raiz (fontes, metadata)
│   └── page.tsx                     # Página principal — lógica e layout
├── components/
│   └── ui/                          # Componentes shadcn/ui
├── hooks/
│   └── useScaleFactor.ts            # Hook de escala via ResizeObserver
└── lib/
    └── utils.ts                     # Utilitário cn()
```

---

## 🖨️ Impressão

Ao clicar em **Imprimir**:

| Modelo | Orientação | Layout |
|--------|-----------|--------|
| Relíquias de Diversão | A4 Paisagem | Grade 2×2 (4 cartazes) |
| Aéreo | A4 Retrato | 2 cartazes centralizados |

O container de impressão fica **oculto na tela** e é exibido apenas via `@media print`, garantindo fidelidade total ao layout impresso.

---

## 🛠️ Stack

| Tecnologia | Versão |
|-----------|--------|
| [Next.js](https://nextjs.org/) | 15.x (Turbopack) |
| [React](https://react.dev/) | 19.x |
| [TypeScript](https://www.typescriptlang.org/) | 5.x |
| [Tailwind CSS](https://tailwindcss.com/) | 3.x |
| [shadcn/ui](https://ui.shadcn.com/) | — |
| [Radix UI](https://www.radix-ui.com/) | — |
| [Lucide React](https://lucide.dev/) | — |

---

## 📋 Tipo de Dados

```typescript
type PosterData = {
  description: string;           // Descrição do produto
  priceFrom: string;             // Preço DE (ex: "49,99")
  priceFor: string;              // Preço POR (ex: "29,99")
  code: string;                  // EAN ou código SAP
  reference: string;             // Referência do produto
  paymentOption: 'normal' | 'installment'; // Forma de pagamento
  posterSubType: 'offer' | 'normal';       // Tipo do cartaz aéreo
};
```

---

## 📄 Licença

Uso interno — Ri Happy Brinquedos.
