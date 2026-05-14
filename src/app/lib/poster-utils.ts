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

  const cleanSupplier = (name: string) => {
    if (!name) return '';
    // Remove prefixo e números (CNPJ)
    let clean = name.replace(/FORNECEDOR:/i, '').replace(/\d+/g, '').trim();
    return clean.substring(0, 15).trim().toUpperCase();
  };

  let poster: any = {
    description: mercadoria.toUpperCase(),
    code: sap,
    ean: ean,
    reference: ref,
    supplier: cleanSupplier(supplier),
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
const normalize = (str: string) => 
  String(str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function createMapping(headers: string[]): Record<string, number> {
  const hasHeaders = headers && headers.length > 0;
  

  const findIdx = (terms: string[], defaultIdx: number) => {
    const normTerms = terms.map(t => normalize(t));
    const idx = headers.findIndex(h => {
      const normH = normalize(h);
      return normTerms.some(t => normH.includes(t));
    });
    
    if (idx !== -1) return idx;
    // Se temos headers mas não encontramos o termo, retornamos -1 para evitar pegar coluna errada
    return hasHeaders ? -1 : defaultIdx;
  };
  
  // Mapeamento baseado na descrição do usuário e imagem
  return {
    sap:        findIdx(['sap', 'interno', 'código', 'codigo', 'cod.', 'cód.'], 2),
    ean:        findIdx(['ean', 'barras'], 3),
    mercadoria: findIdx(['mercadoria', 'descrição', 'descricao', 'produto', 'nome'], 5),
    ref:        findIdx(['referencia', 'referência', 'ref', 'cod. forn', 'cód. forn', 'fornecedor', 'forn'], 4),
    precoAtual: findIdx(['anterior', 'atual', 'preço', 'preÃ§o'], 7),
    novoPreco:  findIdx(['novo'], 8),
    promocao:   findIdx(['promo', 'ção', 'Ã§Ã£o', 'promoção'], 9),
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
      const s = normalize(String(c || ''));
      return s.includes('sap') || s.includes('codigo') || s.includes('interno') || s.includes('mercadoria') || s.includes('ean') || s.includes('forn');
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
