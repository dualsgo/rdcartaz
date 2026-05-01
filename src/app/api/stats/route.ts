import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import * as fs from 'fs';
import * as path from 'path';

export async function GET() {
    const DATA_FILE = path.join(process.cwd(), 'data', 'basedados.json');
    
    if (!fs.existsSync(DATA_FILE)) {
        return NextResponse.json({ count: 0 });
    }

    try {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        const data = JSON.parse(raw);
        return NextResponse.json({ count: data.length });
    } catch (err) {
        console.error('[api/stats] Erro ao ler basedados.json:', err);
        return NextResponse.json({ count: 0, error: 'Internal error' }, { status: 500 });
    }
}
