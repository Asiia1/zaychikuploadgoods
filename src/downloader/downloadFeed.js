import fs from 'node:fs';
import path from 'node:path';
import { OUT_DIR, TIMEOUT_MS } from '../config.js';
import { nowStamp, human } from '../utils/format.js';

export async function downloadFeed(url) {
    const ts = nowStamp();
    const xmlPath = path.join(OUT_DIR, `toysi-${ts}.xml`);

    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

    console.log(`➡️  Скачиваю: ${url}`);

    let res;
    try {
        res = await fetch(url, {
            headers: { 'Accept-Encoding': 'gzip, deflate, br' },
            signal: ctrl.signal
        });
    } catch (err) {
        clearTimeout(timeout);
        throw new Error(`Ошибка сети/таймаут: ${err.message}`);
    }

    clearTimeout(timeout);

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${res.statusText} — ${text.slice(0, 200)}`);
    }

    const contentType = res.headers.get('content-type') || '';
    const contentLen = Number(res.headers.get('content-length') || '0');

    console.log(`📦 Content-Type: ${contentType || 'не указан'}`);
    if (contentLen) console.log(`📏 Размер: ~${human(contentLen)}`);

    const file = fs.createWriteStream(xmlPath);
    const reader = res.body.getReader();

    let received = 0;

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            received += value.byteLength;

            const canContinue = file.write(Buffer.from(value));
            if (!canContinue) {
                await new Promise(resolve => file.once('drain', resolve));
            }

            if (!contentLen && received % (1024 * 1024) < value.byteLength) {
                process.stdout.write(`… получено ${human(received)}\r`);
            }
        }

        await new Promise((resolve, reject) => {
            file.end(err => (err ? reject(err) : resolve()));
        });
    } catch (err) {
        try {
            file.destroy();
        } catch {}
        throw err;
    }

    console.log(`\n✅ XML сохранён: ${xmlPath} (${human(received || contentLen)})`);
    return xmlPath;
}