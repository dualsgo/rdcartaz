import * as XLSX from 'xlsx';
import * as fs from 'fs';

/**
 * Lógica de processamento do Relatório de Mercadorias Sem Giro
 * 
 * Estrutura do arquivo (HTML mascarado de XLS):
 * - Linha 1: Vazia
 * - Linha 2: Header mesclado (Total sem giro)
 * - Linha 3: Header mesclado (Mercadoria sem fornecedor)
 * - Linha 4: Cabeçalhos das colunas
 * - Linha 5+: Dados
 * 
 * Mapeamento de Colunas:
 * A (0): Cod. Interno -> SAP
 * B (1): Cod. Principal -> EAN
 * C (2): Mercadoria -> Descrição
 * D (3): Cod. Fornecedor -> Referência
 * E (4): Marca -> Fornecedor/Marca
 * F (5): Estoque -> Estoque (dividir por 1000)
 * I (8): Preço de Venda -> Preço Regular
 * J (9): Preço Promocional -> Preço Oferta
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
    // Campos formatados para o sistema de cartazes
    isOffer: boolean;
    priceFrom: string;
    priceFor: string;
}

export function parseRelatorioSemGiro(filePath: string): RelatorioSemGiroItem[] {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Arquivo não encontrado: ${filePath}`);
    }

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Converte para matriz 2D para processamento manual (header: 1)
    // Começamos a ler a partir da linha 4 (índice 3) para ignorar os headers mesclados
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];

    const items: RelatorioSemGiroItem[] = [];

    // Ignoramos as primeiras 4 linhas (0, 1, 2, 3) pois a 4ª é o cabeçalho
    // Os dados começam na linha 5 (índice 4)
    for (let i = 4; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 3) continue; // Pula linhas vazias ou incompletas

        const sap = String(row[0] || '').trim();
        const ean = String(row[1] || '').trim();
        const descricao = String(row[2] || '').trim();
        
        if (!sap && !ean) continue;

        const referencia = String(row[3] || '').trim();
        const fornecedor = String(row[4] || '').trim();
        
        // F (5): Estoque - Dividir por 1000 (ex: 1000 vira 1)
        const estoqueRaw = parseFloat(String(row[5]).replace(',', '.')) || 0;
        const estoque = estoqueRaw / 1000;

        // I (8): Preço de Venda
        const precoRegular = parseFloat(String(row[8]).replace(',', '.')) || 0;
        
        // J (9): Preço Promocional
        const precoOferta = parseFloat(String(row[9]).replace(',', '.')) || 0;

        // Lógica de Preço para o Cartaz:
        // Se precoOferta > 0, é uma oferta (isOffer = true)
        // Se precoOferta == 0, usamos o precoRegular como preço final (isOffer = false)
        const isOffer = precoOferta > 0;
        
        const priceFrom = isOffer ? precoRegular.toFixed(2).replace('.', ',') : '0,00';
        const priceFor = isOffer ? precoOferta.toFixed(2).replace('.', ',') : precoRegular.toFixed(2).replace('.', ',');

        items.push({
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

    return items;
}
