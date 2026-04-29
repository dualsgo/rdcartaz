/**
 * Script de conversão: TSV de produtos → JSON indexado para autocomplete
 *
 * Uso:
 *   npx ts-node --project tsconfig.scripts.json scripts/convert-produtos.ts
 *
 * Entrada:  src/data/produtos.tsv
 * Saída:    src/data/produtos.json
 *
 * Formato TSV esperado (separado por TAB):
 *   COD_PRODUTO  DESCRICAO  REFERENCIA  NOME_FORNECEDOR_REGULAR  EAN_PRODUTO_UNITARIO
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const INPUT_FILE = path.join(__dirname, '../src/data/produtos.tsv');
const OUTPUT_FILE = path.join(__dirname, '../src/data/produtos.json');

type ProdutoEntry = {
    description: string;
    reference: string;
    code?: string;  // COD_PRODUTO — preenchido quando buscado pelo EAN
    ean?: string;   // EAN — preenchido quando buscado pelo COD
};

type ProdutoIndex = Record<string, ProdutoEntry>;

async function convert() {
    if (!fs.existsSync(INPUT_FILE)) {
        console.error(`❌ Arquivo não encontrado: ${INPUT_FILE}`);
        console.error('   Coloque o arquivo TSV em src/data/produtos.tsv e execute novamente.');
        process.exit(1);
    }

    const index: ProdutoIndex = {};
    let lineCount = 0;
    let skipped = 0;

    const fileStream = fs.createReadStream(INPUT_FILE, { encoding: 'utf8' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rl = readline.createInterface({ input: fileStream as any, crlfDelay: Infinity });

    let isHeader = true;
    let idxCod = 0, idxDesc = 1, idxRef = 2, idxEan = 4;

    for await (const line of rl) {
        if (!line.trim()) continue;

        const cols = line.split('\t');

        if (isHeader) {
            idxCod = cols.findIndex(c => c.trim() === 'COD_PRODUTO');
            idxDesc = cols.findIndex(c => c.trim() === 'DESCRICAO');
            idxRef = cols.findIndex(c => c.trim() === 'REFERENCIA');
            idxEan = cols.findIndex(c => c.trim() === 'EAN_PRODUTO_UNITARIO');
            isHeader = false;
            continue;
        }

        lineCount++;
        const cod = cols[idxCod]?.trim();
        const desc = cols[idxDesc]?.trim() ?? '';
        const ref = cols[idxRef]?.trim() ?? '';
        const ean = cols[idxEan]?.trim();

        if (!cod && !ean) { skipped++; continue; }

        // Ao buscar pelo COD → retorna o EAN correspondente
        if (cod) {
            index[cod] = { description: desc, reference: ref, ean: ean ?? '' };
        }

        // Ao buscar pelo EAN → retorna o COD correspondente
        if (ean && ean !== cod) {
            index[ean] = { description: desc, reference: ref, code: cod ?? '' };
        }
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index), 'utf8');

    console.log(`✅ Conversão concluída!`);
    console.log(`   Linhas processadas: ${lineCount}`);
    console.log(`   Entradas no índice: ${Object.keys(index).length}`);
    console.log(`   Linhas ignoradas:   ${skipped}`);
    console.log(`   Arquivo gerado:     ${OUTPUT_FILE}`);
}

convert().catch(err => {
    console.error('Erro durante a conversão:', err);
    process.exit(1);
});
