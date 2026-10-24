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

/**
 * Lógica comum de processamento de uma linha de dados (seja vinda de CSV ou Excel)
 */
function processProductRow(row: Record<string, any>, mapping: Record<string, number>, currentSupplier: string, settings?: PosterSettings): any {
  const getVal = (key: string) => {
    const colKey = mapping[key];
    if (colKey === undefined || colKey === -1) return undefined;
    return row[colKey];
  };

  const mercadoriaRaw = getVal('mercadoria');
  const mercadoria = mercadoriaRaw !== undefined ? String(mercadoriaRaw).trim() : '';
  
  if (!mercadoria || mercadoria.toLowerCase().includes('mercadoria') || mercadoria.toLowerCase().includes('descrição')) return null;

  const sap        = String(getVal('sap') || '').trim();
  const ean        = String(getVal('ean') || '').trim();
  const ref        = String(getVal('ref') || '').trim();
  const supplier   = currentSupplier || String(getVal('supplier') || '').trim();
  
  const txtAtual = getVal('precoAtual');
  const txtNovo  = getVal('novoPreco');
  const txtPromo = getVal('promocao');

  const valAtual = parsePrice(txtAtual);
  const valNovo  = parsePrice(txtNovo);
  const valPromo = parsePrice(txtPromo);

  const cleanSupplier = (name: string) => {
    if (!name) return '';
    let clean = name.replace(/FORNECEDOR:\s*[\d.\-\/]+\s*[-–]?\s*/i, '').trim();
    clean = clean.replace(/^\d+[\s\-–]+/, '').trim();
    return clean.substring(0, 15).trim().toUpperCase();
  };

  let poster: any = {
    description: mercadoria.toUpperCase(),
    code: sap,
    ean: ean,
    reference: ref,
    supplier: cleanSupplier(supplier),
    quantity: 1,
  };

  /**
   * Lógica do Usuário:
   * 1. SE TIVERMOS PROMOÇÃO (J), VALE J (Oferta)
   * 2. SE NÃO TIVERMOS PROMOÇÃO, VALE NOVO PREÇO (I)
   * 3. SE NOVO PREÇO < PREÇO ANTERIOR (H) MAS J É ZERO, É REDUÇÃO SEM OFERTA
   */
  if (valPromo > 0) {
    // É Promoção (J)
    poster.posterSubType = 'offer';
    poster.priceFor = formatCurrency(valPromo);
    // O "De" será o Novo (I) se existir e for maior que o promocional, senão o Anterior (H)
    poster.priceFrom = (valNovo > valPromo) ? formatCurrency(valNovo) : (valAtual > valPromo ? formatCurrency(valAtual) : formatCurrency(valAtual));
  } else if (valNovo > 0) {
    poster.posterSubType = 'normal'; 
    poster.priceFor = formatCurrency(valNovo);
    poster.priceFrom = '';
  } else {
    poster.posterSubType = 'normal';
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
  const str = String(val).trim().replace(/\./g, '').replace(',', '.');
  const num = parseFloat(str) || 0;
  return num >= 1000 ? num / 1000 : num;
}

/**
 * Cria um mapeamento de colunas baseado nos headers encontrados ou índices fixos
 */
const normalize = (str: string) => 
  String(str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function createMapping(headers: string[]): Record<string, number> {
  const hasHeaders = headers && headers.length > 0;
  
  const findIdx = (terms: string[], defaultIdx: number) => {
    const normTerms = terms.map(t => normalize(t));
    const idx = headers.findIndex(h => {
      const normH = normalize(h);
      return normTerms.some(t => {
        if (normH === t) return true;
        if (t.length >= 4 && normH.includes(t)) return true;
        const tokens = normH.split(/[\s.\/_-]+/);
        return tokens.includes(t);
      });
    });
    
    if (idx !== -1) return idx;
    return hasHeaders ? -1 : defaultIdx;
  };
  
  const findSupplierIdx = () => {
    const idx = headers.findIndex(h => {
      const normH = normalize(h);
      if (normH.includes('cod. forn') || normH.includes('cód. forn')) return false;
      return normH.includes('fornecedor');
    });
    return idx !== -1 ? idx : -1;
  };

  return {
    sap:        findIdx(['sap', 'interno', 'código', 'codigo', 'cod. int', 'cód. int'], 0),
    ean:        findIdx(['ean', 'barras'], 1),
    mercadoria: findIdx(['mercadoria', 'descrição', 'descricao', 'produto', 'nome'], 2),
    ref:        findIdx(['referencia', 'referência', 'ref', 'cod. forn', 'cód. forn'], 3),
    estoque:    findIdx(['estoque', 'est'], 4),
    precoAtual: findIdx(['anterior', 'atual', 'preço atual', 'preco atual', 'preço', 'preco'], 5),
    novoPreco:  findIdx(['novo', 'novo preço', 'novo preco'], -1),
    promocao:   findIdx(['promoção', 'promocao', 'promo'], 6),
    supplier:   findSupplierIdx(),
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
 * Analisa relatórios Excel (XLS/XLSX ou HTML mascarado de XLS como "relatorio-promocao-com-estoque")
 * com suporte completo a múltiplas tabelas, múltiplas abas e desduplicação inteligente de códigos repetidos.
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

    if (htmlText.toLowerCase().includes('<table') || htmlText.toLowerCase().includes('<html')) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      const tables = Array.from(doc.querySelectorAll('table'));

      if (tables.length > 0) {
        for (const table of tables) {
          // Extrai o fornecedor da tabela (ex: class="header-fornecedor")
          let tableSupplier = '';
          const supplierEl = table.querySelector('.header-fornecedor') || table.querySelector('thead th');
          if (supplierEl && supplierEl.textContent && supplierEl.textContent.toUpperCase().includes('FORNECEDOR')) {
            const raw = supplierEl.textContent.trim();
            let clean = raw.replace(/FORNECEDOR:\s*[\d.\-\/]+\s*[-–]?\s*/i, '').trim();
            clean = clean.replace(/^\d+[\s\-–]+/, '').trim();
            tableSupplier = clean.substring(0, 15).trim().toUpperCase();
          }

          // Identifica cabeçalhos e mapeamento das colunas
          const headerRows = Array.from(table.querySelectorAll('tr')).filter(tr => {
            const text = normalize(tr.textContent || '');
            return text.includes('cod. int') || text.includes('mercadoria') || tr.classList.contains('headers-itens');
          });

          let tableMapping = createMapping([]);
          if (headerRows.length > 0) {
            const thCells = Array.from(headerRows[0].querySelectorAll('th, td')).map(cell => (cell.textContent || '').trim());
            tableMapping = createMapping(thCells);
          }

          // Itera sobre as linhas de produto
          const rows = Array.from(table.querySelectorAll('tbody tr, tr'));
          for (const row of rows) {
            if (row.querySelector('.header-fornecedor') || row.classList.contains('headers-itens')) continue;
            
            const cells = Array.from(row.querySelectorAll('td'));
            if (cells.length < 3) continue;

            const rowData: Record<number, any> = {};
            cells.forEach((cell, idx) => {
              const xStr = cell.getAttribute('x:str');
              rowData[idx] = xStr ? xStr.trim() : (cell.textContent || '').trim();
            });

            const mercadoria = String(rowData[tableMapping.mercadoria] || '').trim();
            if (!mercadoria || mercadoria.toLowerCase().includes('mercadoria') || mercadoria.toLowerCase().includes('total')) continue;

            const sap = String(rowData[tableMapping.sap] || '').trim();
            const ean = String(rowData[tableMapping.ean] || '').trim();
            if (!sap && !ean) continue;

            const key = sap || ean;
            const estoque = parseStock(rowData[tableMapping.estoque]);
            const ref = String(rowData[tableMapping.ref] || '').trim();

            // Desduplicação inteligente: se o mesmo produto já foi encontrado (ex: repetido em múltiplos setores)
            if (itemsMap.has(key)) {
              const existing = itemsMap.get(key);
              if (estoque > 0) {
                existing.stock = (existing.stock || 0) + estoque;
              }
              if (!existing.supplier && tableSupplier) existing.supplier = tableSupplier;
              if (!existing.reference && ref) existing.reference = ref;
              continue; // Não adiciona cartaz redundante
            }

            const poster = processProductRow(rowData, tableMapping, tableSupplier, settings);
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

      for (let i = 0; i < sheetData.length; i++) {
        const cols = sheetData[i];
        if (!cols || cols.length === 0) continue;

        const firstCol = String(cols[0] || '').trim();

        // Linha de Fornecedor mesclada
        if (firstCol.toUpperCase().includes('FORNECEDOR') && (!cols[1] && !cols[2])) {
          let clean = firstCol.replace(/FORNECEDOR:\s*[\d.\-\/]+\s*[-–]?\s*/i, '').trim();
          clean = clean.replace(/^\d+[\s\-–]+/, '').trim();
          currentSupplier = clean.substring(0, 15).trim().toUpperCase();
          continue;
        }

        // Linha de cabeçalho (critérios seguros para não colidir com nomes de brinquedos)
        const isHeader = cols.some(c => {
          const s = normalize(String(c || ''));
          return s.includes('cod. int') || s.includes('codigo int') || s.includes('mercadoria') || s.includes('preco atual') || s.includes('promocao');
        });

        if (isHeader) {
          mapping = createMapping(cols.map(c => String(c || '').trim()));
          continue;
        }

        if (firstCol && firstCol.length >= 3) {
          const rowObj: Record<number, any> = {};
          cols.forEach((val, idx) => { rowObj[idx] = val; });

          const mercadoria = String(rowObj[mapping.mercadoria] || '').trim();
          if (!mercadoria || mercadoria.toLowerCase().includes('mercadoria')) continue;

          const sap = String(rowObj[mapping.sap] || '').trim();
          const ean = String(rowObj[mapping.ean] || '').trim();
          if (!sap && !ean) continue;

          const key = sap || ean;
          const estoque = parseStock(rowObj[mapping.estoque]);

          if (itemsMap.has(key)) {
            const existing = itemsMap.get(key);
            if (estoque > 0) {
              existing.stock = (existing.stock || 0) + estoque;
            }
            if (!existing.supplier && currentSupplier) existing.supplier = currentSupplier;
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
  let data: any[][] = [];

  try {
    const text = new TextDecoder("windows-1252").decode(buffer);
    if (text.toLowerCase().includes('<html') || text.toLowerCase().includes('<table')) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const rows = Array.from(doc.querySelectorAll('tr'));
      data = rows.map(tr => Array.from(tr.querySelectorAll('th, td')).map(td => {
        const xStr = td.getAttribute('x:str');
        if (xStr) return xStr.trim();
        return (td.textContent || '').trim();
      }));
    }
  } catch (e) {}

  if (data.length === 0) {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    data = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false }) as any[][];
  }
  
  if (data.length < 1) return [];

  const items: any[] = [];
  let mapping = createMapping([]); // Default mapping
  
  for (let i = 0; i < data.length; i++) {
    const cols = data[i];
    if (!cols || cols.length === 0) continue;

    // Detectar se é uma linha de header
    const isHeader = cols.some(c => {
      const s = normalize(String(c || ''));
      return s.includes('sap') || s.includes('codigo') || s.includes('interno') || s.includes('mercadoria') || s.includes('ean') || s.includes('forn');
    });

    if (isHeader) {
      const headers = cols.map(h => String(h || '').trim());
      mapping = createMapping(headers);
      continue;
    }

    const getVal = (key: string) => {
      const idx = mapping[key];
      if (idx === undefined || idx === -1) return '';
      return String(cols[idx] || '').trim();
    };

    const description = getVal('mercadoria');
    if (!description || description.toLowerCase().includes('mercadoria') || description.toLowerCase().includes('descrição')) continue;

    const sap = getVal('sap');
    const ean = getVal('ean');
    
    // Ignora se não tiver identificação mínima
    if (!sap && !ean) continue;

    items.push({
      code: sap,
      ean: ean,
      reference: getVal('ref'),
      description: description.toUpperCase(),
    });
  }

  return items;
}




/**
 * Analisa o relatório "Mercadoria Sem Giro" (HTML mascarado de XLS)
 * Extrai dados completos incluindo preços para autopreenchimento
 */
export function parseReportSemGiro(buffer: ArrayBuffer): any[] {
  let data: any[][] = [];

  try {
    const text = new TextDecoder("utf-8").decode(buffer);
    if (text.toLowerCase().includes('<html') || text.toLowerCase().includes('<table')) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const rows = Array.from(doc.querySelectorAll('tr'));
      data = rows.map(tr => Array.from(tr.querySelectorAll('th, td')).map(td => (td.textContent || '').trim()));
    }
  } catch (e) {
    console.error('Erro ao decodificar HTML:', e);
  }

  // Se não for HTML, tenta SheetJS
  if (data.length === 0) {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
  }

  const items: any[] = [];
  
  // O relatório tem headers nas primeiras linhas, os dados começam após os headers mesclados
  // Geralmente a linha 4 (índice 3) é o cabeçalho real
  let headerIdx = -1;
  for(let i=0; i < Math.min(data.length, 10); i++) {
    const rowStr = data[i].join(' ').toLowerCase();
    if (rowStr.includes('cod. interno') || rowStr.includes('mercadoria')) {
      headerIdx = i;
      break;
    }
  }

  if (headerIdx === -1) return [];

  for (let i = headerIdx + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 3) continue;

    const sap = String(row[0] || '').trim();
    const ean = String(row[1] || '').trim();
    const description = String(row[2] || '').trim();

    if (!sap && !ean) continue;
    if (!description || description.toLowerCase().includes('total')) continue;

    // Colunas solicitadas:
    // D(3): Cod. Fornecedor -> Referência
    // E(4): Marca -> Supplier
    // F(5): Estoque -> Dividir por 1000
    // I(8): Preço Regular
    // J(9): Preço Oferta

    const reference = String(row[3] || '').trim();
    const supplier = String(row[4] || '').trim();
    
    // Estoque: 1000 vira 1
    const estoqueRaw = parseFloat(String(row[5] || '0').replace(',', '.')) || 0;
    const estoque = estoqueRaw / 1000;

    const valRegular = parsePrice(row[8]);
    const valOferta = parsePrice(row[9]);

    // Lógica de preços para o cartaz
    const hasOffer = valOferta > 0;
    const priceFrom = hasOffer ? formatCurrency(valRegular) : '';
    const priceFor = hasOffer ? formatCurrency(valOferta) : formatCurrency(valRegular);

    items.push({
      code: sap,
      ean: ean,
      description: description.toUpperCase(),
      reference: reference,
      supplier: supplier.toUpperCase(),
      priceFrom: priceFrom,
      priceFor: priceFor,
      isOffer: hasOffer,
      stock: estoque
    });
  }

  return items;
}
