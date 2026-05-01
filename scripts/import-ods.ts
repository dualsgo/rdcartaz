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

/**
 * Cria um mapeamento dinâmico de colunas baseado nos nomes encontrados no cabeçalho.
 */
function createMapping(headers: string[]): Record<string, string> {
    const findHeader = (terms: string[]) => {
        return headers.find(h => terms.some(t => String(h).toLowerCase().includes(t)));
    };

    return {
        sap: findHeader(['sap', 'interno', 'código', 'codigo', 'cod.']) || 'SAP',
        ean: findHeader(['ean', 'barras']) || 'EAN',
        desc: findHeader(['descrição', 'descricao', 'mercadoria', 'produto', 'nome']) || 'DESCRIÇÃO',
        ref: findHeader(['referencia', 'referência', 'ref']) || 'REFERÊNCIA',
        fornec: findHeader(['fornecedor', 'forn']) || 'FORNECEDOR'
    };
}

async function importData() {
    if (!fs.existsSync(INPUT_FILE)) {
        console.error(`❌ Arquivo de entrada não encontrado: ${INPUT_FILE}`);
        return;
    }

    console.log(`📖 Lendo arquivo: ${path.basename(INPUT_FILE)}...`);
    const workbook = XLSX.readFile(INPUT_FILE);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Converte para JSON (array de objetos)
    const rawData = XLSX.utils.sheet_to_json(worksheet) as any[];
    if (rawData.length === 0) {
        console.warn('⚠️ O arquivo está vazio.');
        return;
    }

    // Pega as chaves do primeiro objeto para criar o mapeamento
    const headers = Object.keys(rawData[0]);
    const mapping = createMapping(headers);
    console.log('📍 Mapeamento detectado:', mapping);

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

    // Mapa para busca rápida (Primary Key: COD_PRODUTO)
    const databaseMap = new Map<string, Produto>();
    baseDados.forEach(p => {
        if (p.COD_PRODUTO) {
            databaseMap.set(String(p.COD_PRODUTO).trim(), p);
        }
    });

    let updatedCount = 0;
    let addedCount = 0;

    console.log(`🚀 Processando ${rawData.length} itens...`);

    rawData.forEach((row) => {
        const sap = String(row[mapping.sap] || '').trim();
        const ean = String(row[mapping.ean] || '').trim();
        const ref = String(row[mapping.ref] || '').trim();
        const desc = String(row[mapping.desc] || '').trim();
        const fornec = String(row[mapping.fornec] || '').trim();

        if (!sap && !ean) return; // Ignora linhas sem identificação

        const produtoData = {
            COD_PRODUTO: sap,
            DESCRICAO: desc.toUpperCase(),
            REFERENCIA: ref,
            NOME_FORNECEDOR_REGULAR: fornec.toUpperCase(),
            EAN_PRODUTO_UNITARIO: ean
        };

        const key = sap || ean; // Usa SAP como chave primária, ou EAN se SAP faltar

        if (databaseMap.has(key)) {
            // Atualiza apenas os campos mapeados, preservando outros campos existentes no JSON
            const existing = databaseMap.get(key)!;
            Object.assign(existing, produtoData);
            updatedCount++;
        } else {
            // Adiciona novo item
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

