import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { cleanSupplierName, extractSectionSupplier, parseStock, parsePrice, formatCurrency } from '../src/app/lib/poster-utils';

/**
 * Lógica de processamento do Relatório de Mercadorias Sem Giro (ERP Pleno)
 * 
 * Estrutura de Linhas do arquivo (HTML mascarado de XLS com 1 tabela e 112 seções):
 * - Linha de Resumo Geral (`<td colspan="12" class="td-cabecalho-nome">`):
 *   "Total de Mercadorias sem Giro: 4281" -> ignorada
 * - Linhas de Cabeçalho de Seção / Fornecedor (`<td colspan="12" class="td-cabecalho-nome">`):
 *   1ª seção: "Mercadoria sem fornecedor - Total de Mercadorias: 2406" -> fornecedor vazio (usa coluna Marca ou base local)
 *   Demais seções: "<COD> - <FORNECEDOR> - Total de Mercadorias: <QTD>" (ex: "270 - ARCOM S/A - Total de Mercadorias: 4")
 * - Linhas de Cabeçalho de Colunas (`<tr class="tr-cabecalho-nome">`, repetidas no início de cada seção):
 *   Coluna A (0): Cod. Interno -> SAP (code)
 *   Coluna B (1): Cod. Principal -> EAN (ean)
 *   Coluna C (2): Mercadoria -> Descrição do produto (description)
 *   Coluna D (3): Cod. Fornecedor -> Referência do fabricante (reference)
 *   Coluna E (4): Marca -> Marca/Fornecedor na linha (fallback caso a seção não tenha fornecedor)
 *   Coluna F (5): Estoque -> Quantidade física formatada com 3 casas decimais ("2.000" = 2 un, "290.000" = 290 un)
 *   Coluna G (6): Vlr Estoque -> Valor contábil de estoque (ignorado)
 *   Coluna H (7): Custo Praticado -> Custo unitário (ignorado)
 *   Coluna I (8): Preço de Venda -> Preço Regular ("DE" quando há promoção, ou "POR" quando preço normal)
 *   Coluna J (9): Preço Promocional -> Preço Oferta ("0,00" quando não está em promoção)
 *   Coluna K (10): Data Última Entrada (ignorado)
 *   Coluna L (11): Data Última Venda (ignorado)
 */

export interface RelatorioSemGiroItem {
    sap: string;
    ean: string;
    descricao: string;
    referencia: string;
    fornecedor: string;
    estoque: number;
    precoRegular: number;
    precoOferta: number;
    isOffer: boolean;
    priceFrom: string;
    priceFor: string;
}

export function parseRelatorioSemGiro(filePath: string): RelatorioSemGiroItem[] {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Arquivo não encontrado: ${filePath}`);
    }

    const workbook = XLSX.readFile(filePath, { raw: false });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' }) as any[][];
    const itemsMap = new Map<string, RelatorioSemGiroItem>();
    let currentSupplier = '';

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const firstCol = String(row[0] || '').trim();
        if (!row[1] && !row[2]) {
            const sectionSup = extractSectionSupplier(firstCol);
            if (sectionSup !== null) {
                currentSupplier = sectionSup;
            }
            continue;
        }

        const sap = firstCol;
        if (!sap || sap.toLowerCase().includes('cod. int') || sap.toLowerCase().includes('total')) continue;

        const ean = String(row[1] || '').trim();
        const descricao = String(row[2] || '').trim();
        if (!descricao || descricao.toLowerCase() === 'mercadoria') continue;

        const referencia = String(row[3] || '').trim();
        const rowBrand = cleanSupplierName(String(row[4] || '').trim());
        const fornecedor = rowBrand || currentSupplier;
        const estoque = parseStock(row[5]);
        const precoRegular = parsePrice(row[8]);
        const precoOferta = parsePrice(row[9]);

        const isOffer = precoOferta > 0 && precoOferta < precoRegular;
        const priceFrom = isOffer ? formatCurrency(precoRegular) : '';
        const priceFor = isOffer ? formatCurrency(precoOferta) : formatCurrency(precoRegular);

        const key = sap || ean;
        if (itemsMap.has(key)) {
            const existing = itemsMap.get(key)!;
            existing.estoque = Math.max(existing.estoque, estoque);
            if (!existing.fornecedor && fornecedor) existing.fornecedor = fornecedor;
            if (!existing.referencia && referencia) existing.referencia = referencia;
            continue;
        }

        itemsMap.set(key, {
            sap,
            ean,
            descricao: descricao.toUpperCase(),
            referencia,
            fornecedor: fornecedor.toUpperCase(),
            estoque,
            precoRegular,
            precoOferta,
            isOffer,
            priceFrom,
            priceFor
        });
    }

    return Array.from(itemsMap.values());
}
