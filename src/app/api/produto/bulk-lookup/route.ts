import { NextRequest, NextResponse } from 'next/server';
import { loadProdutos } from '../data-manager';

const MAX_KEYS = 5000;
const KEY_PATTERN = /^[a-zA-Z0-9\-_]{1,30}$/;

export async function POST(request: NextRequest) {
    try {
        const contentLength = request.headers.get('content-length');
        if (contentLength && parseInt(contentLength, 10) > 1024 * 1024) {
            return NextResponse.json({ error: 'Payload muito grande.' }, { status: 413 });
        }

        const body = await request.json() as { keys: unknown };
        if (!body.keys || !Array.isArray(body.keys)) {
            return NextResponse.json({ error: 'Campo "keys" é obrigatório.' }, { status: 400 });
        }
        if (body.keys.length > MAX_KEYS) {
            return NextResponse.json({ error: `Limite máximo de ${MAX_KEYS} chaves por requisição.` }, { status: 400 });
        }

        const produtos = loadProdutos();
        const results: Record<string, unknown> = Object.create(null);

        for (const rawKey of body.keys) {
            if (typeof rawKey !== 'string') continue;
            const key = rawKey.trim();
            if (!KEY_PATTERN.test(key)) continue;
            if (Object.prototype.hasOwnProperty.call(produtos, key)) {
                results[key] = produtos[key];
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (err) {
        console.error('[api/produto/bulk-lookup] Erro:', err);
        return NextResponse.json({ error: 'Erro interno na busca em lote.' }, { status: 500 });
    }
}
