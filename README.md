# 🏷️ RD Cartaz — Interface Web

Esta é uma interface web desenvolvida para a planilha **RD Cartaz**, utilizada como uma solução paliativa e eficiente para a geração e impressão de cartazes promocionais. O objetivo é oferecer uma alternativa mais ágil e visual ao uso direto de planilhas.

Atualmente suporta os modelos da loja **Ri Happy**: **Relíquias de Diversão**, **Aéreo**, **Gôndola Oficial** e **Totem**.

---

## ✨ Funcionalidades

### Modelo Relíquias de Diversão
- **4 cartazes** por folha A4 paisagem dispostos em **grade 2×2**
- Cada cartaz editado individualmente nas abas 1–4
- Exibição do desconto percentual em destaque (bloco preto)
- Preço DE (riscado) + POR em tipografia grande
- Apenas opções de Oferta.

### Modelo Aéreo
- **4 cartazes** por folha A4 retrato (empilhados em uma coluna)
- Design achatado e de alto impacto para encaixe em prateleiras ou testeiras
- Lado esquerdo com preço DE e lado direito com bloco de desconto em destaque
- Suporta preço normal e oferta.

### Modelo Totem
- **1 cartaz** por folha A4 retrato (tamanho total da folha)
- Ideal para pilhas de produtos e displays grandes de chão
- Preço gigante com alto impacto visual
- Suporta apenas modo Oferta.

### Parcelamento Inteligente e Seguro
- Cálculo automático de parcelamento caso o produto atinja o valor mínimo
- O usuário pode configurar nas configurações (ícone de engrenagem) as regras, limitadas de forma segura:
  - **Máximo de parcelas:** travado em opções pré-definidas (6x ou 10x).
  - **Parcela mínima:** Piso de R$ 29,99 garantido pelo sistema.

### Geral
- **Pré-visualização em tempo real** — muda ao trocar de modelo ou preencher os dados
- **Importação de Preços** — carregue o relatório Excel de "Mercadorias sem giro" para autopreencher os valores ao bipar
- **Impressão fiel** via `window.print()` com `@media print` dedicado, perfeitamente ajustado às margens do papel
- Layout responsivo para Desktop e Tablets

---

## 🚀 Rodando localmente

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

```bash
# Build de produção
npm run build
npm start
```

---

## 🖨️ Dicas de Impressão

Para o cartaz sair no tamanho correto e evitar páginas em branco, você **PRECISA CONFERIR** se nas configurações de impressão do seu navegador (Chrome/Edge):
- A **Margem** está definida como "Padrão" ou "Nenhuma"
- A **Escala** está em 100% (Padrão)
- O **Formato** da página respeita a orientação avisada pelo sistema (Retrato ou Paisagem)
- A opção de **Imprimir gráficos de fundo (Background graphics)** está ATIVADA (para que as cores dos blocos de oferta sejam impressas corretamente).

| Modelo | Orientação | Layout |
|--------|-----------|--------|
| Relíquias de Diversão | A4 Paisagem | Grade 2×2 (4 cartazes) |
| Aéreo | A4 Retrato | 4 cartazes (empilhados) |
| Totem | A4 Retrato | 1 cartaz (preenche a folha inteira) |

---

## 🛠️ Stack

| Tecnologia | Versão |
|-----------|--------|
| [Next.js](https://nextjs.org/) | 15.x |
| [React](https://react.dev/) | 19.x |
| [TypeScript](https://www.typescriptlang.org/) | 5.x |
| [Tailwind CSS](https://tailwindcss.com/) | 3.x |
| [shadcn/ui](https://ui.shadcn.com/) | — |

---

## 📄 Licença

Uso interno — Ri Happy Brinquedos.
