import * as fs from 'fs';
import * as path from 'path';

const BASE_FILE = path.join(__dirname, '../data/basedados.json');
const INDEX_FILE = path.join(__dirname, '../data/produtos.json');

function sync() {
    console.log('🔄 Sincronizando basedados.json -> produtos.json...');
    const raw = fs.readFileSync(BASE_FILE, 'utf8');
    const data = JSON.parse(raw);
    
    const index: Record<string, any> = {};
    
    data.forEach((p: any) => {
        const entry = {
            description: p.DESCRICAO,
            reference: p.REFERENCIA,
            ean: p.EAN_PRODUTO_UNITARIO,
            code: p.COD_PRODUTO,
            supplier: p.NOME_FORNECEDOR_REGULAR
        };
        
        if (p.COD_PRODUTO) index[String(p.COD_PRODUTO).trim()] = entry;
        if (p.EAN_PRODUTO_UNITARIO) index[String(p.EAN_PRODUTO_UNITARIO).trim()] = entry;
    });
    
    fs.writeFileSync(INDEX_FILE, JSON.stringify(index), 'utf8');
    console.log(`✅ Sincronização concluída! ${Object.keys(index).length} entradas geradas.`);
}

sync();
