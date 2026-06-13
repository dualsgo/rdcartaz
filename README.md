# 🏷️ RD Cartaz | Geração Inteligente de Cartazes Promocionais

Esta é uma interface web robusta desenvolvida para a plataforma **RD Cartaz**, criada para ser a solução definitiva, visual e de alta eficiência para a geração e impressão de cartazes promocionais em loja. O objetivo é eliminar as barreiras operacionais do uso de planilhas complexas, oferecendo uma experiência fluida, automatizada e aderente aos padrões visuais do varejo.

Atualmente suporta os modelos da loja **Ri Happy**: **Relíquias de Diversão**, **Aéreo**, **Gôndola Oficial** e **Totem**.

---

## 🎯 A Proposta

O **RD Cartaz** foi projetado sob três pilares fundamentais para revolucionar a operação no piso de loja:

1. **Agilidade e Automação Visual**: Substitui a manipulação de dados "crus" em planilhas por uma interface amigável e em tempo real. Os cartazes são montados visualmente com formatação automática de preços, descontos e parcelamentos.
2. **Integração e Inteligência de Preços**: Capacidade de importar relatórios do Excel (ex: "Mercadorias sem giro") e pré-carregar a precificação. Ao bipar ou inserir o código de um produto, o sistema preenche automaticamente os valores, eliminando o erro humano na digitação.
3. **Impressão Nativa e Precisa**: Ao contrário de soluções adaptadas que perdem o formato na hora de imprimir, o sistema conta com uma engenharia de `@media print` dedicada. Cada layout respeita milimetricamente as margens do papel (A4 Retrato ou Paisagem) para impressão direta pelo navegador sem necessidade de exportação ou ajustes manuais.

---

## 💻 Arquitetura e Stack Tecnológica

O sistema foi construído utilizando uma stack moderna focada em performance e modularidade:

- **Framework Core**: React 19 com Next.js 15 (App Router) garantindo carregamento rápido e roteamento simplificado.
- **Tipagem Estrita**: TypeScript para garantir robustez e manutenibilidade do código.
- **Estilização e UI Premium**: Tailwind CSS integrado à biblioteca `shadcn/ui`, proporcionando uma interface de usuário moderna, limpa e altamente responsiva.
- **Manipulação de Dados e Arquivos**: Leitura estruturada de planilhas Excel nativa no frontend utilizando a biblioteca `xlsx`.
- **Leitura de Código de Barras**: Integração nativa com `html5-qrcode` para escaneamento rápido de produtos via webcam ou leitores externos.
- **Validação de Dados**: Formulários tipados e seguros utilizando `react-hook-form` aliado ao `zod`.

---

## 🧩 Os Modelos e Funcionalidades

O ecossistema conta com diversos modelos de cartazes focados em diferentes necessidades promocionais e espaços da loja:

### 🎮 Modelo Relíquias de Diversão
- **Disposição**: 4 cartazes por folha A4 paisagem (grade 2×2).
- **Funcionalidades**:
  - Edição individual de cada cartaz em abas independentes.
  - Exibição de desconto percentual em bloco destacado (bloco preto).
  - Composição visual agressiva de preço "DE" (riscado) + "POR" com tipografia proeminente.
  - Exclusivo para modo Oferta.

### ✈️ Modelo Aéreo
- **Disposição**: 4 cartazes por folha A4 retrato (empilhados em coluna).
- **Funcionalidades**:
  - Design achatado de altíssimo impacto para encaixe em prateleiras, cantoneiras ou testeiras.
  - Bloco de preço "DE" à esquerda e desconto em destaque à direita.
  - Flexível: Suporta exibição de preço normal e preço de oferta.

### 🛒 Modelo Gôndola Oficial
- Focado na exibição padronizada das canaletas e precificadores de gôndolas convencionais, mantendo a identidade visual exigida pela marca.

### 🏢 Modelo Totem
- **Disposição**: 1 cartaz por folha A4 retrato (ocupação total da página).
- **Funcionalidades**:
  - Especialmente criado para pilhas de produtos volumosos e displays grandes de chão.
  - Preço em tamanho máximo para impacto visual de longa distância.
  - Focado exclusivamente em precificação promocional de Oferta.

### 💳 Parcelamento Inteligente e Seguro
O aplicativo remove a complexidade do operador na hora de calcular parcelas financeiras:
- **Cálculo Automático**: Identifica se o produto atinge o valor mínimo e projeta as opções de parcelamento.
- **Travas de Segurança**:
  - O sistema trava opções máximas em regras predefinidas (ex: 6x ou 10x).
  - Garante o **piso mínimo de R$ 29,99** por parcela, blindando a operação contra falhas humanas que poderiam desrespeitar as regras de crédito da empresa.

---

## 🚀 Como Iniciar (Rodando Localmente)

1. Clone o repositório e acesse a pasta raiz.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
4. Acesse via navegador `http://localhost:9002` (ou porta configurada).
5. Para gerar uma versão de produção otimizada:
   ```bash
   npm run build
   npm start
   ```

---

## 🖨️ Dicas de Impressão (Importante)

O sistema de geração de impressão via navegador é poderoso, mas exige configurações mínimas no ato da impressão (Ctrl+P / Cmd+P no Chrome/Edge) para garantir a perfeição visual e ausência de páginas em branco adicionais:

1. **Margem**: Deve ser configurada como **"Nenhuma"** (ou "Padrão", caso "Nenhuma" não esteja disponível).
2. **Escala / Zoom**: Manter sempre em **100% (Padrão)**.
3. **Orientação**: Respeite a orientação do modelo atual (Retrato ou Paisagem) informada no sistema.
4. **Gráficos de Fundo (Background graphics)**: OBRIGATORIAMENTE **ativado** para que as cores de destaque e blocos promocionais sejam impressos.

**Resumo de Orientação por Modelo:**
| Modelo | Orientação | Layout de Impressão |
|--------|-----------|--------|
| Relíquias de Diversão | A4 Paisagem | Grade 2×2 (4 cartazes simultâneos) |
| Aéreo | A4 Retrato | 4 cartazes empilhados verticalmente |
| Totem | A4 Retrato | 1 cartaz preenchendo a folha por completo |

---

## 📄 Licença

Uso interno — **Ri Happy Brinquedos**.
