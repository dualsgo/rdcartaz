import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import * as fs from 'fs';
import * as path from 'path';

import { loadProdutos } from '../produto/data-manager';

export async function GET() {
    try {
        const produtos = loadProdutos();
        // Filtramos chaves SAP (≤ 10 dígitos) para ter o contador real de produtos únicos
        let count = 0;
        for (const k in produtos) {
            if (k.length <= 10) count++;
        }
        return NextResponse.json({ count });
    } catch (err) {
        console.error('[api/stats] Erro:', err);
        return NextResponse.json({ count: 0, error: 'Internal error' }, { status: 500 });
    }
}
