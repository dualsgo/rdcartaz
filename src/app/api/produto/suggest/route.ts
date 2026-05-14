import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import * as fs from 'fs';
import * as path from 'path';
import { suggestCacheValid, markSuggestCacheValid } from '../../suggest-cache';

import { getSuggestCache } from '../data-manager';

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

        const all = getSuggestCache();
        const matches: any[] = [];
        const searchPrefix = prefix.toUpperCase();

        for (const item of all) {
            // Busca por código (início) OU descrição (contém) - Usando searchDesc pré-calculado
            if (item.key.startsWith(prefix) || item.searchDesc.includes(searchPrefix)) {
                matches.push({ key: item.key, description: item.description });
                if (matches.length >= 15) break; 
            }
        }

        return NextResponse.json(matches);
    } catch (err) {
        console.error('[api/produto/suggest] Error:', err);
        return NextResponse.json([]);
    }
}
