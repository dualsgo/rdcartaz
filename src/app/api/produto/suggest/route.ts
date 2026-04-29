import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import * as fs from 'fs';
import * as path from 'path';
import { suggestCacheValid, markSuggestCacheValid } from '../../suggest-cache';

type SuggestItem = { key: string; description: string };

let cacheAll: SuggestItem[] | null = null;

function loadAll(): SuggestItem[] {
    // Invalida cache se um novo produto foi salvo
    if (!suggestCacheValid) {
        cacheAll = null;
        markSuggestCacheValid();
    }

    if (cacheAll) return cacheAll;

    const filePath = path.join(process.cwd(), 'data', 'produtos.json');
    if (!fs.existsSync(filePath)) {
        cacheAll = [];
        return cacheAll;
    }

    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const obj = JSON.parse(raw) as Record<string, { description?: string }>;
        const result: SuggestItem[] = [];
        
        // Otimização: for...in é mais leve em memória que Object.entries para objetos gigantes
        for (const k in obj) {
            if (/^\d+$/.test(k)) {
                result.push({ key: k, description: obj[k]?.description ?? '' });
            }
        }
        cacheAll = result;
    } catch {
        cacheAll = [];
    }

    return cacheAll;
}

export async function GET(request: NextRequest) {
    try {
        const prefix = request.nextUrl.searchParams.get('prefix')?.trim() ?? '';

        if (!prefix || prefix.length < 2) {
            return NextResponse.json([]);
        }

        // Limite de tamanho e apenas alfanuméricos no prefixo de busca
        if (prefix.length > 20 || !/^[a-zA-Z0-9 ]+$/.test(prefix)) {
            return NextResponse.json([]);
        }

        const all = loadAll();
        const matches: SuggestItem[] = [];
        const searchPrefix = prefix.toUpperCase();

        for (const item of all) {
            // Busca por código (início) OU descrição (contém)
            if (item.key.startsWith(prefix) || item.description.toUpperCase().includes(searchPrefix)) {
                matches.push(item);
                if (matches.length >= 15) break; // aumentado para 15 sugestões
            }
        }

        return NextResponse.json(matches);
    } catch (err) {
        console.error('[api/produto/suggest] Error:', err);
        return NextResponse.json([]);
    }
}
