import { NextRequest, NextResponse } from 'next/server';
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

    const filePath = path.join(process.cwd(), 'src', 'data', 'produtos.json');
    if (!fs.existsSync(filePath)) {
        cacheAll = [];
        return cacheAll;
    }

    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const obj = JSON.parse(raw) as Record<string, { description?: string }>;
        cacheAll = Object.entries(obj)
            .filter(([k]) => /^\d+$/.test(k))   // apenas chaves numéricas (SAP e EAN)
            .map(([k, v]) => ({ key: k, description: v?.description ?? '' }));
    } catch {
        cacheAll = [];
    }

    return cacheAll;
}

export async function GET(request: NextRequest) {
    const prefix = request.nextUrl.searchParams.get('prefix')?.trim() ?? '';

    if (!prefix || prefix.length < 2) {
        return NextResponse.json([]);
    }

    // Limite de tamanho e apenas alfanuméricos no prefixo de busca
    if (prefix.length > 20 || !/^[a-zA-Z0-9]+$/.test(prefix)) {
        return NextResponse.json([]);
    }

    const all = loadAll();
    const matches: SuggestItem[] = [];

    for (const item of all) {
        if (item.key.startsWith(prefix)) {
            matches.push(item);
            if (matches.length >= 10) break; // máximo 10 sugestões
        }
    }

    return NextResponse.json(matches);
}
