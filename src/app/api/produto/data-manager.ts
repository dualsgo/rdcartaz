import * as fs from 'fs';
import * as path from 'path';
import { suggestCacheValid, markSuggestCacheValid, invalidateSuggestCache } from '../suggest-cache';

export type ProdutoEntry = {
    description: string;
    reference: string;
    code?: string;
    ean?: string;
    supplier?: string;
    priceFrom?: string;
    priceFor?: string;
};

export type SuggestItem = { key: string; description: string; searchDesc: string };

let produtosCache: Record<string, ProdutoEntry> | null = null;
let suggestCache: SuggestItem[] | null = null;
let lastLoadTime: number = 0;

const DATA_FILE = path.join(process.cwd(), 'data', 'produtos.json');

export function loadProdutos(): Record<string, ProdutoEntry> {
    const now = Date.now();
    // Re-check file if cache is older than 5 minutes or doesn't exist
    // This helps in development and multi-instance environments
    if (produtosCache && (now - lastLoadTime < 300000) && suggestCacheValid) {
        return produtosCache;
    }

    if (!fs.existsSync(DATA_FILE)) {
        produtosCache = {};
        lastLoadTime = now;
        return produtosCache;
    }

    try {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        produtosCache = JSON.parse(raw);
        lastLoadTime = now;
        console.log(`[data-manager] ${Object.keys(produtosCache!).length} entradas carregadas.`);
        
        // Invalida cache de sugestão se carregamos do disco
        suggestCache = null; 
    } catch (err) {
        console.error('[data-manager] Erro ao ler produtos.json:', err);
        produtosCache = produtosCache || {};
    }
    return produtosCache!;
}

export function saveProdutos(data: Record<string, ProdutoEntry>): void {
    try {
        const dir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
        produtosCache = data;
        lastLoadTime = Date.now();
        invalidateSuggestCache();
        suggestCache = null;
    } catch (err) {
        console.error(`[data-manager] Erro ao salvar produtos.json:`, err);
        throw err;
    }
}

export function getSuggestCache(): SuggestItem[] {
    if (!suggestCacheValid) {
        suggestCache = null;
        markSuggestCacheValid();
    }

    if (suggestCache) return suggestCache;

    const products = loadProdutos();
    const result: SuggestItem[] = [];
    
    for (const k in products) {
        // Apenas chaves numéricas (EAN/SAP) para sugestão de código
        if (/^\d+$/.test(k)) {
            const desc = products[k].description || '';
            result.push({ 
                key: k, 
                description: desc,
                searchDesc: desc.toUpperCase() // Cache do uppercase para busca rápida
            });
        }
    }
    suggestCache = result;
    return suggestCache;
}
