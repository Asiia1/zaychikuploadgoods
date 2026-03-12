import fs from 'node:fs';
import path from 'node:path';
import xmlFlow from 'xml-flow';
import { MAX_ITEMS } from '../config.js';
import { normalizeProduct } from '../normalizers/normalizeProduct.js';
import { mapToHoroshopProduct } from '../mappers/mapToHoroshopProduct.js';

export function parseXmlToJson(xmlPath) {
    return new Promise((resolve, reject) => {
        const { dir, name } = path.parse(xmlPath);
        const jsonPath = path.join(dir, `${name}.json`);
        const samplePath = path.join(dir, `${name}.sample-50.json`);

        const src = fs.createReadStream(xmlPath);
        const flow = xmlFlow(src, { trim: true });

        const out = fs.createWriteStream(jsonPath, { flags: 'w' });
        out.write('[');

        const sample = [];
        const products = [];
        let count = 0;
        let wroteAny = false;
        let finalized = false;

        const PRODUCT_TAGS = ['offer', 'item', 'product'];

        function cleanup() {
            for (const tag of PRODUCT_TAGS) {
                flow.removeAllListeners(`tag:${tag}`);
            }
            flow.removeAllListeners('end');
            flow.removeAllListeners('error');
        }

        function handleNode(node) {
            if (finalized) return;

            const normalized = normalizeProduct(node);
            if (!normalized.sku && !normalized.name) return;

            const horoshopProduct = mapToHoroshopProduct(normalized);
            products.push(horoshopProduct);

            if (wroteAny) out.write(',');
            out.write('\n' + JSON.stringify(normalized));
            wroteAny = true;

            if (sample.length < 50) sample.push(normalized);

            count++;

            if (count % 1000 === 0) {
                process.stdout.write(`… распознано ${count}\r`);
            }

            if (MAX_ITEMS && count >= MAX_ITEMS) {
                finalize();
            }
        }

        async function finalize() {
            if (finalized) return;
            finalized = true;

            cleanup();

            try {
                try {
                    src.destroy();
                } catch {}

                out.write('\n]');

                await new Promise((resolveEnd, rejectEnd) => {
                    out.end(err => (err ? rejectEnd(err) : resolveEnd()));
                });

                await fs.promises.writeFile(samplePath, JSON.stringify(sample, null, 2), 'utf8');

                console.log(`\n✅ Парсинг завершён.`);
                console.log(`JSON:   ${jsonPath}`);
                console.log(`Sample: ${samplePath}`);
                console.log(`Всего товаров: ${count}${MAX_ITEMS ? ` (лимит ${MAX_ITEMS})` : ''}`);

                resolve({ jsonPath, samplePath, count, products });
            } catch (err) {
                reject(err);
            }
        }

        for (const tag of PRODUCT_TAGS) {
            flow.on(`tag:${tag}`, handleNode);
        }

        flow.on('end', () => {
            finalize().catch(reject);
        });

        flow.on('error', err => {
            console.error('❌ Ошибка парсинга XML:', err.message);
            try {
                out.destroy();
            } catch {}
            reject(err);
        });

        src.on('error', err => {
            console.error('❌ Ошибка чтения XML:', err.message);
            try {
                out.destroy();
            } catch {}
            reject(err);
        });

        out.on('error', err => {
            console.error('❌ Ошибка записи JSON:', err.message);
            reject(err);
        });
    });
}