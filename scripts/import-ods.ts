import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// Configurações de caminhos
const INPUT_FILE = path.join(__dirname, '../Relatorio de Estoque por Item.ods');
const JSON_FILE = path.join(__dirname, '../data/basedados.json');

type Produto = {
    COD_PRODUTO: string;
    DESCRICAO: string;
    REFERENCIA: string;
    NOME_FORNECEDOR_REGULAR: string;
    EAN_PRODUTO_UNITARIO: string;
    [key: string]: any;
};


async function importData() {
    if (!fs.existsSync(INPUT_FILE)) {
        console.error(`❌ Arquivo de entrada não encontrado: ${INPUT_FILE}`);
        return;
    }

    console.log(`📖 Lendo arquivo: ${path.basename(INPUT_FILE)}...`);
    const workbook = XLSX.readFile(INPUT_FILE);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Converte para matriz 2D para processamento manual
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false }) as any[][];
    if (data.length === 0) {
        console.warn('⚠️ O arquivo está vazio.');
        return;
    }

    console.log('📖 Lendo banco de dados JSON...');
    let baseDados: Produto[] = [];
    if (fs.existsSync(JSON_FILE)) {
        try {
            const raw = fs.readFileSync(JSON_FILE, 'utf8');
            baseDados = JSON.parse(raw);
        } catch (e) {
            console.error('❌ Erro ao ler/parsear base de dados JSON:', e);
            baseDados = [];
        }
    }

    const databaseMap = new Map<string, Produto>();
    baseDados.forEach(p => {
        if (p.COD_PRODUTO) {
            databaseMap.set(String(p.COD_PRODUTO).trim(), p);
        }
    });

    let mapping: Record<string, number> = { sap: 2, ean: 3, desc: 5, ref: 4, fornec: -1 };
    let currentSupplier = '';
    let updatedCount = 0;
    let addedCount = 0;

    console.log(`🚀 Processando ${data.length} linhas...`);

    const normalize = (str: string) => String(str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    data.forEach((cols) => {
        if (!cols || cols.length === 0) return;

        const firstCol = String(cols[0] || '').trim();

        // 1. Detectar linha de Fornecedor
        if (firstCol.toUpperCase().includes('FORNECEDOR')) {
            currentSupplier = firstCol.replace(/FORNECEDOR:/i, '').trim();
            return;
        }

        // 2. Detectar linha de header
        const isHeader = cols.some(c => {
            const s = normalize(String(c || ''));
            return s.includes('sap') || s.includes('codigo') || s.includes('interno') || s.includes('mercadoria') || s.includes('ean') || s.includes('forn');
        });

        if (isHeader) {
            const headers = cols.map(h => String(h || '').trim());
            
            const findIdx = (terms: string[]) => {
                const normTerms = terms.map(t => normalize(t));
                return headers.findIndex(h => {
                    const normH = normalize(h);
                    return normTerms.some(t => normH.includes(t));
                });
            };
            
            mapping = {
                sap: findIdx(['sap', 'interno', 'código', 'codigo', 'cod.', 'cód.']),
                ean: findIdx(['ean', 'barras']),
                desc: findIdx(['descrição', 'descricao', 'mercadoria', 'produto', 'nome']),
                ref: findIdx(['referencia', 'referência', 'ref', 'cod. forn', 'cód. forn', 'fornecedor', 'forn']),
                fornec: findIdx(['fornecedor', 'forn'])
            };
            return;
        }

        const getVal = (idx: number) => (idx !== -1 && cols[idx]) ? String(cols[idx]).trim() : '';
        const cleanName = (name: string) => {
            if (!name) return '';
            // Remove números (CNPJ) e limita em 20 chars
            let clean = name.replace(/\d+/g, '').trim();
            return clean.substring(0, 20).trim().toUpperCase();
        };

        const sap = getVal(mapping.sap);
        const ean = getVal(mapping.ean);
        const desc = getVal(mapping.desc);
        const ref = getVal(mapping.ref);
        const rawFornec = getVal(mapping.fornec) || currentSupplier;
        const fornec = cleanName(rawFornec);

        if (!desc || desc.toLowerCase().includes('mercadoria') || desc.toLowerCase().includes('descrição')) return;
        if (!sap && !ean) return;

        const produtoData = {
            COD_PRODUTO: sap,
            DESCRICAO: desc.toUpperCase(),
            REFERENCIA: ref,
            NOME_FORNECEDOR_REGULAR: fornec,
            EAN_PRODUTO_UNITARIO: ean
        };

        const key = sap || ean;

        if (databaseMap.has(key)) {
            const existing = databaseMap.get(key)!;
            Object.assign(existing, produtoData);
            updatedCount++;
        } else {
            baseDados.push(produtoData);
            databaseMap.set(key, produtoData);
            addedCount++;
        }
    });

    console.log('💾 Salvando banco de dados...');
    fs.writeFileSync(JSON_FILE, JSON.stringify(baseDados, null, 4), 'utf8');

    console.log(`✅ Importação concluída!`);
    console.log(`   Itens atualizados: ${updatedCount}`);
    console.log(`   Itens adicionados: ${addedCount}`);
}

importData().catch(err => {
    console.error('❌ Erro crítico durante a importação:', err);
    process.exit(1);
});

