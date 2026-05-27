import { NextRequest, NextResponse } from 'next/server';
import { loadProdutos } from '../data-manager';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as { keys: string[] };
        if (!body.keys || !Array.isArray(body.keys)) {
            return NextResponse.json({ error: 'Campo "keys" é obrigatório.' }, { status: 400 });
        }

        const produtos = loadProdutos();
        const results: Record<string, any> = {};

        for (const key of body.keys) {
            if (produtos[key]) {
                results[key] = produtos[key];
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (err) {
        console.error('[api/produto/bulk-lookup] Erro:', err);
        return NextResponse.json({ error: 'Erro interno na busca em lote.' }, { status: 500 });
    }
}
