import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const ODS_FILE = path.join(__dirname, '../Relatorio de Estoque por Item.ods');
const JSON_FILE = path.join(__dirname, '../data/basedados.json');

type Produto = {
    COD_PRODUTO: string;
    DESCRICAO: string;
    REFERENCIA: string;
    NOME_FORNECEDOR_REGULAR: string;
    EAN_PRODUTO_UNITARIO: string;
    [key: string]: string;
};

async function importOds() {
    console.log('📖 Lendo arquivo ODS...');
    const workbook = XLSX.readFile(ODS_FILE);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const odsData = XLSX.utils.sheet_to_json(worksheet) as any[];

    console.log('📖 Lendo banco de dados JSON...');
    let baseDados: Produto[] = [];
    if (fs.existsSync(JSON_FILE)) {
        const raw = fs.readFileSync(JSON_FILE, 'utf8');
        baseDados = JSON.parse(raw);
    }

    // Criar um mapa para busca rápida por COD_PRODUTO
    const databaseMap = new Map<string, Produto>();
    baseDados.forEach(p => {
        if (p.COD_PRODUTO) {
            databaseMap.set(String(p.COD_PRODUTO), p);
        }
    });

    let updatedCount = 0;
    let addedCount = 0;

    console.log(`🚀 Processando ${odsData.length} itens do ODS...`);

    odsData.forEach((row) => {
        const sap = String(row['SAP'] || '').trim();
        const ref = String(row['REFERÊNCIA'] || '').trim();
        const ean = String(row['EAN'] || '').trim();
        const desc = String(row['DESCRIÇÃO'] || '').trim();
        const fornec = String(row['FORNECEDOR'] || '').trim();

        if (!sap) return; // Ignora se não tiver código SAP

        const produto: Produto = {
            COD_PRODUTO: sap,
            DESCRICAO: desc,
            REFERENCIA: ref,
            NOME_FORNECEDOR_REGULAR: fornec,
            EAN_PRODUTO_UNITARIO: ean
        };

        if (databaseMap.has(sap)) {
            // Atualiza
            const existing = databaseMap.get(sap)!;
            Object.assign(existing, produto);
            updatedCount++;
        } else {
            // Adiciona
            baseDados.push(produto);
            databaseMap.set(sap, produto);
            addedCount++;
        }
    });

    console.log('💾 Salvando banco de dados...');
    fs.writeFileSync(JSON_FILE, JSON.stringify(baseDados, null, 4), 'utf8');

    console.log(`✅ Importação concluída!`);
    console.log(`   Itens atualizados: ${updatedCount}`);
    console.log(`   Itens adicionados: ${addedCount}`);
}

importOds().catch(err => {
    console.error('❌ Erro durante a importação:', err);
    process.exit(1);
});
