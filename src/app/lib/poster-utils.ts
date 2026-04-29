import * as XLSX from 'xlsx';
import type { PosterSettings } from './types';

export function calculateInstallments(price: number, settings: PosterSettings) {
  if (price <= 0) return { maxInstallments: 0, installmentValue: 0 };
  
  // O usuário quer "parcela mínima de X". 
  // O sistema atual usa 29.99 (R$ 30,00 na prática).
  const minAmount = settings.minInstallmentAmount;
  
  // Quantas parcelas cabem se cada uma for pelo menos minAmount?
  // Ex: 100 / 30 = 3.33 -> 3 parcelas.
  const possibleInstallments = Math.floor(price / (minAmount - 0.01));
  
  // Mas não podemos passar do limite configurado (ex: 6x ou 10x)
  const maxInstallments = Math.min(possibleInstallments, settings.maxInstallments);
  
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
    useGrouping: false,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).slice(0, 7);
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
function processProductRow(row: Record<string, any>, mapping: Record<string, number>, currentSupplier: string): any {
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

  let poster: any = {
    description: mercadoria.toUpperCase(),
    code: sap,
    ean: ean,
    reference: ref,
    supplier: supplier.replace('FORNECEDOR:', '').trim().toUpperCase(),
    quantity: 1,
    paymentOption: 'installment',
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
    // O "De" será o Novo (I) se existir e for maior, senão o Anterior (H)
    poster.priceFrom = (valNovo > valPromo) ? formatCurrency(valNovo) : formatCurrency(valAtual);
  } else if (valNovo > 0) {
    // É Novo Preço (I)
    // Se baixou em relação ao anterior (H) mas não tem valor em J:
    // O usuário disse: "pode ser redução mas sem oferta nesse caso J estara zerado mas I sera menor que H"
    if (valNovo < valAtual && valAtual > 0) {
      // Se baixou, PODERIA ser oferta, mas o usuário indicou que nesse caso (J=0) 
      // pode ser apenas uma redução de preço normal.
      // Vou assumir que se baixou, ainda mostramos como oferta para destacar, 
      // A MENOS que o sistema queira tratar como preço normal.
      // Mas o pedido diz "usaremos valor de I se J estiver zerado".
      poster.posterSubType = 'normal'; 
      poster.priceFor = formatCurrency(valNovo);
      poster.priceFrom = '';
    } else {
      // Se manteve ou subiu (aumento), é normal
      poster.posterSubType = 'normal';
      poster.priceFor = formatCurrency(valNovo);
      poster.priceFrom = '';
    }
  } else {
    // É Preço Atual/Anterior (H)
    poster.posterSubType = 'normal';
    poster.priceFor = formatCurrency(valAtual);
    poster.priceFrom = '';
  }

  return poster;
}

/**
 * Cria um mapeamento de colunas baseado nos headers encontrados ou índices fixos
 */
function createMapping(headers: string[]): Record<string, number> {
  const findIdx = (terms: string[], defaultIdx: number) => {
    const idx = headers.findIndex(h => terms.some(t => h.toLowerCase().includes(t)));
    return idx !== -1 ? idx : defaultIdx;
  };
  
  // Mapeamento baseado na descrição do usuário e imagem (lidando com encoding corrompido)
  // Relatório Circular: C=2 (SAP), D=3 (EAN), E=4 (Ref), F=5 (Desc), H=7 (Ant), I=8 (Novo), J=9 (Promo)
  return {
    sap:        findIdx(['sap', 'interno', 'código', 'codigo', 'cod.'], 2),
    ean:        findIdx(['ean', 'barras'], 3),
    mercadoria: findIdx(['mercadoria', 'descrição', 'descricao', 'produto', 'nome'], 5),
    ref:        findIdx(['referencia', 'referência', 'ref', 'fornecedor'], 4),
    precoAtual: findIdx(['anterior', 'atual', 'preÃ§o'], 7),
    novoPreco:  findIdx(['novo'], 8),
    promocao:   findIdx(['promo', 'Ã§Ã£o', 'promoção'], 9),
    supplier:   findIdx(['fornecedor', 'forn'], -1),
  };
}

/**
 * Analisa um arquivo CSV
 */
export function parseProductCSV(content: string): any[] {
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const firstLine = lines[0];
  const separator = firstLine.includes(';') ? ';' : ',';
  const headers = firstLine.split(separator).map(h => h.trim());
  const mapping = createMapping(headers);
  
  const results: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(separator).map(c => c.trim());
    if (cols.length < 2) continue;
    
    const rowObj: Record<number, string> = {};
    cols.forEach((val, idx) => { rowObj[idx] = val; });
    
    const poster = processProductRow(rowObj, mapping, '');
    if (poster) results.push(poster);
  }
  return results;
}

/**
 * Analisa um arquivo Excel (XLS/XLSX)
 */
export function parseProductExcel(buffer: ArrayBuffer): any[] {
  let data: any[][] = [];

  // Muitos sistemas exportam relatórios em HTML com extensão .xls.
  // O SheetJS converte "259,99" para "25999" (pois entende a vírgula como milhar no padrão americano).
  // Para evitar isso, interceptamos arquivos HTML e lemos os textos originais.
  try {
    const text = new TextDecoder("windows-1252").decode(buffer);
    if (text.toLowerCase().includes('<html') || text.toLowerCase().includes('<table')) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const rows = Array.from(doc.querySelectorAll('tr'));
      data = rows.map(tr => Array.from(tr.querySelectorAll('th, td')).map(td => {
        // ERPs geralmente escondem o texto completo no atributo x:str
        // e deixam o texto truncado (ex: "JW DINO") no conteúdo visual (textContent).
        // Já para os preços, o x:num costuma ter os centavos distorcidos (3999), 
        // então pegamos o textContent ("39,99") ignorando o x:num.
        const xStr = td.getAttribute('x:str');
        if (xStr) return xStr.trim();
        return (td.textContent || '').trim();
      }));
    }
  } catch (e) {
    // Ignora erro de decoder
  }

  // Se não for HTML (ou falhar), usa o SheetJS normalmente
  if (data.length === 0) {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    data = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false }) as any[][];
  }
  
  if (data.length < 1) return [];

  let currentSupplier = '';
  let mapping = createMapping([]); // Default mapping
  const results: any[] = [];

  for (let i = 0; i < data.length; i++) {
    const cols = data[i];
    if (!cols || cols.length === 0) continue;

    const firstCol = String(cols[0] || '').trim();

    // 1. Detectar linha de Fornecedor (Mesclada A-G)
    if (firstCol.toUpperCase().includes('FORNECEDOR') && (!cols[1] && !cols[2])) {
      currentSupplier = firstCol;
      continue;
    }

    // 2. Detectar se é uma linha de header (procura palavras-chave em qualquer coluna)
    const isHeader = cols.some(c => {
      const s = String(c || '').toLowerCase();
      return s.includes('sap') || s.includes('código') || s.includes('interno') || s.includes('mercadoria') || s.includes('ean');
    });

    if (isHeader) {
      const headers = cols.map(h => String(h || '').trim());
      mapping = createMapping(headers);
      continue;
    }

    // 3. Processar como produto
    if (firstCol && firstCol.length >= 3) {
      const rowObj: Record<number, any> = {};
      cols.forEach((val, idx) => { rowObj[idx] = val; });

      const poster = processProductRow(rowObj, mapping, currentSupplier);
      if (poster) results.push(poster);
    }
  }

  return results;
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
  
  // O usuário informou:
  // Col C (2) para codigo SAP
  // Col D (3) para o EAN
  // Col E (4) para referencia
  // Col F (5) para descrição
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 6) continue;

    const description = String(row[5] || '').trim();
    if (!description || description.toLowerCase().includes('mercadoria') || description.toLowerCase().includes('descrição')) continue;

    items.push({
      code: String(row[2] || '').trim(),
      ean: String(row[3] || '').trim(),
      reference: String(row[4] || '').trim(),
      description: description.toUpperCase(),
    });
  }

  return items;
}



