import * as XLSX from 'xlsx';
import type { PosterSettings } from './types';

export function calculateInstallments(price: number, settings: PosterSettings) {
  if (price <= 0) return { maxInstallments: 0, installmentValue: 0 };
  
  // O usuário quer "parcela mínima de X". 
  // O sistema atual usa 29.99 (R$ 30,00 na prática).
  const minAmount = Math.max(settings.minInstallmentAmount, 29.99);
  
  // Quantas parcelas cabem se cada uma for pelo menos minAmount?
  // Ex: 100 / 30 = 3.33 -> 3 parcelas.
  const possibleInstallments = Math.floor(price / (minAmount - 0.01));
  
  // Mas não podemos passar do limite configurado (ex: 6x ou 10x)
  const safeMaxConfigured = Math.max(6, Math.min(10, settings.maxInstallments));
  const maxInstallments = Math.min(possibleInstallments, safeMaxConfigured);
  
  if (maxInstallments <= 1) return { maxInstallments: 0, installmentValue: 0 };
  
  const rawInstallment = price / maxInstallments;
  const installmentValue = Math.ceil(rawInstallment * 100) / 100;
  
  return { maxInstallments, installmentValue };
}

export function parsePrice(price: any): number {
  if (price === undefined || price === null || price === '') return 0;
  
  // Se já for um número (comum no Excel), retorna direto sem converter para string
  if (typeof price === 'number') return price;
  
  let str = String(price).trim().replace('R$', '').replace(/\s/g, '');
  if (!str) return 0;
  
  // Se tem vírgula, ela manda (padrão Brasil: 1.234,56 ou 259,99)
  if (str.includes(',')) {
    return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
  }
  
  // Se não tem vírgula mas tem ponto, verificamos se o ponto é decimal ou milhar
  if (str.includes('.')) {
    const parts = str.split('.');
    // Se o ponto separa exatamente 2 casas no final, é centavo
    if (parts.length === 2 && parts[1].length === 2) {
      return parseFloat(str) || 0;
    }
    // Caso contrário, é milhar, removemos o ponto
    return parseFloat(str.replace(/\./g, '')) || 0;
  }
  
  const val = parseFloat(str) || 0;
  // Limite global de 9999,99 para todos os modelos
  return Math.min(val, 9999.99);
}

export function formatCurrency(value: number): string {
  // Limite de segurança para exibição
  const safeValue = Math.min(value, 9999.99);
  return safeValue.toLocaleString('pt-br', {
    useGrouping: true,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Limita o texto em N caracteres sem cortar palavras ao meio.
 */
export function truncateDescription(text: string, limit: number): string {
  if (!text || text.length <= limit) return text;
  
  const words = text.split(' ');
  let result = '';
  
  for (const word of words) {
    const space = result ? ' ' : '';
    if ((result + space + word).length <= limit) {
      result += space + word;
    } else {
      break;
    }
  }
  
  return result || text.slice(0, limit);
}

/**
 * Divide o texto em múltiplas linhas com limite de caracteres por linha,
 * sem cortar palavras e respeitando o número máximo de linhas.
 */
export function truncateMultiLine(text: string, charsPerLine: number, maxLines: number): string[] {
  if (!text) return [];
  
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const space = currentLine ? ' ' : '';
    if ((currentLine + space + word).length <= charsPerLine) {
      currentLine += space + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
      
      if (currentLine.length > charsPerLine) {
        currentLine = currentLine.slice(0, charsPerLine);
      }
      
      if (lines.length >= maxLines) {
        currentLine = '';
        break;
      }
    }
  }
  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }
  
  return lines;
}

export function cleanSupplierName(name: string): string {
  if (!name) return '';
  let clean = name.replace(/total de mercadorias sem giro.*$/i, '').trim();
  if (!clean || /mercadoria sem fornecedor/i.test(clean)) return '';
  // Remove sufixo "- Total de Mercadorias: N" (padrão Relatório Sem Giro)
  clean = clean.split(/\s*[-–]\s*total de mercadorias\s*:/i)[0].trim();
  // Remove prefixo "FORNECEDOR: CNPJ - " ou código numérico "270 - "
  clean = clean.replace(/FORNECEDOR:\s*[\d.\-\/]+\s*[-–]?\s*/i, '').trim();
  clean = clean.replace(/^\d+\s*[-–]\s*/, '').trim();
  return clean.substring(0, 20).trim().toUpperCase();
}

/**
 * Extrai nome do fornecedor de uma linha de seção mesclada (ex: Relatório Sem Giro ou Relatório de Promoção)
 * Retorna:
 * - string (vazia se "Mercadoria sem fornecedor", ou nome limpo do fornecedor)
 * - null se a linha não for um cabeçalho de seção de fornecedor
 */
export function extractSectionSupplier(rawText: string): string | null {
  const text = String(rawText || '').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  if (/total de mercadorias sem giro/i.test(text)) return null;
  if (/mercadoria sem fornecedor/i.test(text)) return '';
  if (/total de mercadorias\s*:/i.test(text) || /fornecedor\s*:/i.test(text)) {
    return cleanSupplierName(text);
  }
  return null;
}

/**
 * Lógica comum de processamento de uma linha de dados (seja vinda de CSV, Alteração de Preço ou Sem Giro)
 */
function processProductRow(row: Record<string, any>, mapping: Record<string, number>, currentSupplier: string, settings?: PosterSettings): any {
  const getVal = (key: string) => {
    const colKey = mapping[key];
    if (colKey === undefined || colKey === -1) return undefined;
    return row[colKey];
  };

  const mercadoriaRaw = getVal('mercadoria');
  const mercadoria = mercadoriaRaw !== undefined ? String(mercadoriaRaw).trim() : '';
  
  if (
    !mercadoria ||
    mercadoria.toLowerCase().includes('mercadoria') ||
    mercadoria.toLowerCase().includes('descrição') ||
    mercadoria.toLowerCase().includes('cod. interno')
  ) {
    return null;
  }

  const sap        = String(getVal('sap') || '').trim();
  const ean        = String(getVal('ean') || '').trim();
  const ref        = String(getVal('ref') || '').trim();
  const rowBrand   = String(getVal('supplier') || '').trim();
  const supplier   = rowBrand || currentSupplier;
  
  const txtAtual = getVal('precoAtual');
  const txtNovo  = getVal('novoPreco');
  const txtPromo = getVal('promocao');

  const valAtual = parsePrice(txtAtual);
  const valNovo  = parsePrice(txtNovo);
  const valPromo = parsePrice(txtPromo);

  const poster: any = {
    description: mercadoria.toUpperCase(),
    code: sap,
    ean: ean,
    reference: ref,
    supplier: cleanSupplierName(supplier),
    quantity: 1,
  };

  /**
   * Lógica de Preços (compatível com Relatório de Alteração de Preço e Relatório Sem Giro):
   * - No Relatório Sem Giro: precoAtual = Preço de Venda (Col I / 8), promocao = Preço Promocional (Col J / 9)
   * - No Relatório de Alteração: precoAtual = Preço Anterior (H), novoPreco = Novo Preço (I), promocao = Promoção (J)
   * 1. SE TIVERMOS PROMOÇÃO > 0 (e menor que o preço base), VALE OFERTA (DE = Novo ou Venda, POR = Promoção)
   * 2. SE NÃO TIVERMOS PROMOÇÃO, VALE PREÇO NORMAL (POR = Novo Preço ou Preço de Venda)
   */
  const baseRegular = valNovo > 0 ? valNovo : valAtual;
  if (valPromo > 0 && (baseRegular === 0 || valPromo < baseRegular)) {
    poster.posterSubType = 'offer';
    poster.isOffer = true;
    poster.priceFor = formatCurrency(valPromo);
    poster.priceFrom = baseRegular > valPromo ? formatCurrency(baseRegular) : formatCurrency(valAtual);
  } else if (valNovo > 0) {
    poster.posterSubType = 'normal';
    poster.isOffer = false;
    poster.priceFor = formatCurrency(valNovo);
    poster.priceFrom = '';
  } else {
    poster.posterSubType = 'normal';
    poster.isOffer = false;
    poster.priceFor = formatCurrency(valAtual);
    poster.priceFrom = '';
  }

  // Automatização do parcelamento
  const finalPrice = parsePrice(poster.priceFor);
  if (settings) {
    const { maxInstallments } = calculateInstallments(finalPrice, settings);
    poster.paymentOption = (maxInstallments > 1 && finalPrice > 59.99) ? 'installment' : 'normal';
  } else {
    poster.paymentOption = finalPrice > 59.99 ? 'installment' : 'normal';
  }

  return poster;
}

export function parseStock(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val >= 1000 ? val / 1000 : val;
  const str = String(val).trim();
  if (!str) return 0;
  // Padrão ERP Pleno / Sem Giro: 3 casas decimais ("2.000" = 2, "290.000" = 290, "1.250,000" = 1250)
  if (/^[+-]?[\d.]+[.,]\d{3}$/.test(str)) {
    const raw = parseInt(str.replace(/[.,]/g, ''), 10) || 0;
    return raw / 1000;
  }
  const normalized = str.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(normalized) || 0;
  return num >= 1000 ? num / 1000 : num;
}

/**
 * Cria um mapeamento de colunas baseado nos headers encontrados ou índices fixos.
 * Suporta tanto o Relatório de Alteração de Preços quanto o Relatório de Mercadoria Sem Giro:
 * - A (0): Cod. Interno -> sap
 * - B (1): Cod. Principal / EAN -> ean
 * - C (2): Mercadoria -> mercadoria
 * - D (3): Cod. Fornecedor / Ref -> ref
 * - E (4): Marca / Fornecedor -> supplier
 * - F (5): Estoque -> estoque (ignora "Vlr Estoque")
 * - I (8): Preço de Venda / Preço Atual -> precoAtual
 * - J (9): Preço Promocional / Promoção -> promocao
 */
const normalize = (str: string) => 
  String(str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

function createMapping(headers: string[]): Record<string, number> {
  const hasHeaders = headers && headers.length > 0;
  const normHeaders = headers.map(h => normalize(h));

  const findExactOrPartial = (exactTerms: string[], partialTerms: string[], excludeTerms: string[], defaultIdx: number) => {
    const normExact = exactTerms.map(t => normalize(t));
    const normPartial = partialTerms.map(t => normalize(t));
    const normExclude = excludeTerms.map(t => normalize(t));

    // 1. Busca exata primeiro
    let idx = normHeaders.findIndex(h => normExact.includes(h));
    if (idx !== -1) return idx;

    // 2. Busca parcial respeitando exclusões
    idx = normHeaders.findIndex(h => {
      if (!h) return false;
      if (normExclude.some(ex => h.includes(ex))) return false;
      return normPartial.some(t => {
        if (h === t) return true;
        if (t.length >= 4 && h.includes(t)) return true;
        const tokens = h.split(/[\s.\/_-]+/);
        return tokens.includes(t);
      });
    });

    if (idx !== -1) return idx;
    return hasHeaders ? -1 : defaultIdx;
  };

  return {
    sap:        findExactOrPartial(['cod. interno', 'cod interno', 'cod. int', 'codigo interno', 'sap'], ['sap', 'interno', 'cod. int', 'codigo'], ['fornecedor', 'principal'], 0),
    ean:        findExactOrPartial(['cod. principal', 'cod principal', 'ean', 'codigo de barras'], ['principal', 'ean', 'barras'], ['interno', 'fornecedor'], 1),
    mercadoria: findExactOrPartial(['mercadoria', 'descricao', 'produto'], ['mercadoria', 'descricao', 'produto', 'nome'], ['status', 'total'], 2),
    ref:        findExactOrPartial(['cod. fornecedor', 'cod fornecedor', 'referencia', 'ref'], ['referencia', 'ref', 'cod. forn', 'cod. fornecedor'], [], 3),
    supplier:   findExactOrPartial(['marca', 'fornecedor'], ['marca', 'fornecedor'], ['cod. forn', 'cod fornecedor', 'codigo'], -1),
    estoque:    findExactOrPartial(['estoque', 'qtd estoque'], ['estoque', 'est'], ['vlr', 'valor', 'tipo'], 5),
    precoAtual: findExactOrPartial(['preco de venda', 'preco atual', 'preco anterior', 'anterior'], ['preco de venda', 'preco atual', 'anterior', 'atual', 'preco'], ['promocional', 'promocao', 'promo', 'novo', 'custo', 'vlr'], 8),
    novoPreco:  findExactOrPartial(['novo preco', 'preco novo', 'novo'], ['novo preco', 'novo'], ['promocional', 'promocao'], -1),
    promocao:   findExactOrPartial(['preco promocional', 'promocao', 'preco promo'], ['promocional', 'promocao', 'promo'], [], 9),
  };
}

/**
 * Analisa um arquivo CSV com desduplicação automática
 */
export function parseProductCSV(content: string, settings?: PosterSettings): any[] {
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const firstLine = lines[0];
  const separator = firstLine.includes(';') ? ';' : ',';
  const headers = firstLine.split(separator).map(h => h.trim());
  const mapping = createMapping(headers);
  
  const itemsMap = new Map<string, any>();
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(separator).map(c => c.trim());
    if (cols.length < 2) continue;
    
    const rowObj: Record<number, string> = {};
    cols.forEach((val, idx) => { rowObj[idx] = val; });
    
    const poster = processProductRow(rowObj, mapping, '', settings);
    if (poster && (poster.code || poster.ean)) {
      const key = poster.code || poster.ean;
      if (!itemsMap.has(key)) {
        itemsMap.set(key, poster);
      }
    }
  }
  return Array.from(itemsMap.values());
}

/**
 * Analisa relatórios Excel (XLS/XLSX ou HTML mascarado de XLS como "relatorio-promocao-com-estoque" e "Mercadoria Sem Giro")
 * com suporte completo a múltiplas tabelas, seções agrupadas por fornecedor, múltiplas abas e desduplicação inteligente.
 */
export function parseProductExcel(buffer: ArrayBuffer, settings?: PosterSettings): any[] {
  const itemsMap = new Map<string, any>();

  // 1. Tenta interpretar como HTML (muitos relatórios do ERP Pleno são HTML exportados como .xls)
  try {
    let htmlText = '';
    const testDecoder = new TextDecoder('utf-8');
    const sample = testDecoder.decode(buffer.slice(0, 1024));
    
    if (sample.toLowerCase().includes('charset=utf-8') || sample.toLowerCase().includes('charset="utf-8"')) {
      htmlText = testDecoder.decode(buffer);
    } else {
      const winText = new TextDecoder('windows-1252').decode(buffer);
      htmlText = winText.toLowerCase().includes('<html') || winText.toLowerCase().includes('<table') ? winText : testDecoder.decode(buffer);
    }

    const isSemGiroReport = normalize(htmlText.slice(0, 4000)).includes('mercadoria sem giro');

    if (htmlText.toLowerCase().includes('<table') || htmlText.toLowerCase().includes('<html')) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      const tables = Array.from(doc.querySelectorAll('table'));

      if (tables.length > 0) {
        for (const table of tables) {
          // Extrai o fornecedor inicial da tabela (ex: class="header-fornecedor" no relatório de promoção)
          let currentSupplier = '';
          const supplierEl = table.querySelector('.header-fornecedor') || table.querySelector('thead th');
          if (supplierEl && supplierEl.textContent) {
            const parsedSup = extractSectionSupplier(supplierEl.textContent);
            if (parsedSup !== null) {
              currentSupplier = parsedSup;
            }
          }

          // Identifica cabeçalhos iniciais e mapeamento das colunas
          const headerRows = Array.from(table.querySelectorAll('tr')).filter(tr => {
            const text = normalize(tr.textContent || '');
            return (
              tr.classList.contains('tr-cabecalho-nome') ||
              tr.classList.contains('headers-itens') ||
              (text.includes('cod. int') && text.includes('mercadoria'))
            );
          });

          let tableMapping = createMapping([]);
          if (headerRows.length > 0) {
            const thCells = Array.from(headerRows[0].querySelectorAll('th, td')).map(cell => (cell.textContent || '').trim());
            tableMapping = createMapping(thCells);
          }

          // Itera sobre as linhas da tabela (respeitando quebras de seção de fornecedor no meio da mesma tabela)
          const rows = Array.from(table.querySelectorAll('tr'));
          for (const row of rows) {
            // Verifica se é uma linha de seção / fornecedor (ex: <td colspan="12" class="td-cabecalho-nome">270 - ARCOM S/A - Total de Mercadorias: 4</td>)
            const colspanCell = row.querySelector('td[colspan], th[colspan], .header-fornecedor, .td-cabecalho-nome');
            if (colspanCell && row.querySelectorAll('td, th').length <= 2) {
              const sectionSup = extractSectionSupplier(colspanCell.textContent || '');
              if (sectionSup !== null) {
                currentSupplier = sectionSup;
              }
              continue;
            }

            // Verifica se é uma linha de cabeçalho de colunas (repetida a cada seção no relatório Sem Giro)
            const rowNorm = normalize(row.textContent || '');
            if (
              row.classList.contains('tr-cabecalho-nome') ||
              row.classList.contains('headers-itens') ||
              (rowNorm.includes('cod. int') && rowNorm.includes('mercadoria'))
            ) {
              const thCells = Array.from(row.querySelectorAll('th, td')).map(cell => (cell.textContent || '').trim());
              if (thCells.length >= 3) {
                tableMapping = createMapping(thCells);
              }
              continue;
            }
            
            const cells = Array.from(row.querySelectorAll('td'));
            if (cells.length < 3) continue;

            const rowData: Record<number, any> = {};
            cells.forEach((cell, idx) => {
              const xStr = cell.getAttribute('x:str');
              rowData[idx] = xStr ? xStr.trim() : (cell.textContent || '').trim();
            });

            const mercadoria = String(rowData[tableMapping.mercadoria] || '').trim();
            if (!mercadoria || mercadoria.toLowerCase() === 'mercadoria' || mercadoria.toLowerCase().includes('total de mercadorias')) continue;

            const sap = String(rowData[tableMapping.sap] || '').trim();
            const ean = String(rowData[tableMapping.ean] || '').trim();
            if (!sap && !ean) continue;

            const key = sap || ean;
            const estoque = parseStock(rowData[tableMapping.estoque]);
            const ref = String(rowData[tableMapping.ref] || '').trim();
            const rowBrand = tableMapping.supplier !== undefined && tableMapping.supplier !== -1
              ? cleanSupplierName(String(rowData[tableMapping.supplier] || ''))
              : '';
            const effectiveSupplier = rowBrand || currentSupplier;

            // Desduplicação inteligente:
            // No relatório Sem Giro, o mesmo produto pode se repetir em dois códigos de fornecedor com o MESMO estoque total da loja.
            // Já em relatórios por setor/gôndola, os estoques se somam se não forem do Sem Giro.
            if (itemsMap.has(key)) {
              const existing = itemsMap.get(key);
              if (estoque > 0) {
                if (isSemGiroReport) {
                  existing.stock = Math.max(existing.stock || 0, estoque);
                } else {
                  existing.stock = (existing.stock || 0) + estoque;
                }
              }
              if (!existing.supplier && effectiveSupplier) existing.supplier = effectiveSupplier;
              if (!existing.reference && ref) existing.reference = ref;
              if (!existing.ean && ean) existing.ean = ean;
              continue; // Não adiciona cartaz redundante
            }

            const poster = processProductRow(rowData, tableMapping, currentSupplier, settings);
            if (poster) {
              poster.stock = estoque;
              itemsMap.set(key, poster);
            }
          }
        }

        if (itemsMap.size > 0) {
          return Array.from(itemsMap.values());
        }
      }
    }
  } catch (e) {
    console.error('HTML table parsing fallback to SheetJS:', e);
  }

  // 2. Fallback para arquivos binários XLS / XLSX via SheetJS (com suporte a TODAS as abas e desduplicação)
  try {
    const workbook = XLSX.read(buffer, { type: 'array' });
    
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false }) as any[][];
      if (!sheetData || sheetData.length === 0) continue;

      let currentSupplier = '';
      let mapping = createMapping([]);
      let isSemGiroSheet = false;

      for (let i = 0; i < sheetData.length; i++) {
        const cols = sheetData[i];
        if (!cols || cols.length === 0) continue;

        const firstCol = String(cols[0] || '').trim();
        if (normalize(firstCol).includes('mercadoria sem giro')) {
          isSemGiroSheet = true;
        }

        // Linha de seção / fornecedor mesclada (ex: "FORNECEDOR: ..." ou "270 - ARCOM S/A - Total de Mercadorias: 4")
        if (!cols[1] && !cols[2]) {
          const sectionSup = extractSectionSupplier(firstCol);
          if (sectionSup !== null) {
            currentSupplier = sectionSup;
            continue;
          }
        }

        // Linha de cabeçalho (critérios seguros para não colidir com nomes de brinquedos)
        const isHeader = cols.some(c => {
          const s = normalize(String(c || ''));
          return s.includes('cod. int') || s.includes('codigo int') || s.includes('cod. principal') || s.includes('preco atual') || s.includes('preco promocional');
        });

        if (isHeader) {
          mapping = createMapping(cols.map(c => String(c || '').trim()));
          continue;
        }

        if (firstCol && firstCol.length >= 1) {
          const rowObj: Record<number, any> = {};
          cols.forEach((val, idx) => { rowObj[idx] = val; });

          const mercadoria = String(rowObj[mapping.mercadoria] || '').trim();
          if (!mercadoria || mercadoria.toLowerCase() === 'mercadoria' || mercadoria.toLowerCase().includes('total de mercadorias')) continue;

          const sap = String(rowObj[mapping.sap] || '').trim();
          const ean = String(rowObj[mapping.ean] || '').trim();
          if (!sap && !ean) continue;

          const key = sap || ean;
          const estoque = parseStock(rowObj[mapping.estoque]);
          const ref = String(rowObj[mapping.ref] || '').trim();
          const rowBrand = mapping.supplier !== undefined && mapping.supplier !== -1
            ? cleanSupplierName(String(rowObj[mapping.supplier] || ''))
            : '';
          const effectiveSupplier = rowBrand || currentSupplier;

          if (itemsMap.has(key)) {
            const existing = itemsMap.get(key);
            if (estoque > 0) {
              if (isSemGiroSheet) {
                existing.stock = Math.max(existing.stock || 0, estoque);
              } else {
                existing.stock = (existing.stock || 0) + estoque;
              }
            }
            if (!existing.supplier && effectiveSupplier) existing.supplier = effectiveSupplier;
            if (!existing.reference && ref) existing.reference = ref;
            if (!existing.ean && ean) existing.ean = ean;
            continue;
          }

          const poster = processProductRow(rowObj, mapping, currentSupplier, settings);
          if (poster) {
            poster.stock = estoque;
            itemsMap.set(key, poster);
          }
        }
      }
    }
  } catch (e) {
    console.error('SheetJS parse error:', e);
  }

  return Array.from(itemsMap.values());
}

/**
 * Analisa um arquivo Excel (XLS/XLSX) especificamente para o BANCO DE DADOS
 */
export function parseDatabaseImportExcel(buffer: ArrayBuffer): any[] {
  const parsed = parseProductExcel(buffer);
  return parsed.map(item => ({
    code: item.code || '',
    ean: item.ean || '',
    reference: item.reference || '',
    description: (item.description || '').toUpperCase(),
    supplier: (item.supplier || '').toUpperCase(),
  }));
}

/**
 * Analisa o relatório "Mercadoria Sem Giro" (HTML mascarado de XLS ou planilha Excel)
 * Extrai dados completos incluindo fornecedor por seção, estoque real e preços para autopreenchimento e geração de cartazes/etiquetas
 */
export function parseReportSemGiro(buffer: ArrayBuffer, settings?: PosterSettings): any[] {
  const parsed = parseProductExcel(buffer, settings);
  return parsed.map(item => ({
    code: item.code || '',
    ean: item.ean || '',
    description: (item.description || '').toUpperCase(),
    reference: item.reference || '',
    supplier: (item.supplier || '').toUpperCase(),
    priceFrom: item.priceFrom || '',
    priceFor: item.priceFor || '0,00',
    isOffer: Boolean(item.isOffer),
    posterSubType: item.posterSubType || (item.isOffer ? 'offer' : 'normal'),
    stock: item.stock ?? 0,
    installments: item.installments || 1,
    installmentPrice: item.installmentPrice || '0,00',
  }));
}
