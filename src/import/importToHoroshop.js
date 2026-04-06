import axios from 'axios';
import fs from 'node:fs';
import path from 'node:path';
import { IMPORT_URL, IS_LOCAL, OUT_DIR } from '../config.js';

const RATE_LIMIT_DELAY_MS = 60 * 1000;
const MAX_RETRIES = 3;

function isRateLimit(data, err) {
    if (data?.response?.code === 429 || data?.status === 429) return true;
    if (err?.response?.data?.response?.code === 429) return true;
    if (err?.response?.status === 429) return true;
    return false;
}

export async function importToHoroshop(token, products) {
    const batchSize = 5000;
    const timeout = 15 * 60 * 1000;
    const responses = [];

    for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        const label = `Batch ${i + 1}-${i + batch.length}`;
        let attempt = 0;
        let pushed = false;

        while (attempt <= MAX_RETRIES && !pushed) {
            try {
                const { data } = await axios.post(
                    IMPORT_URL,
                    {
                        token,
                        products: batch,
                        new_products: 'import',
                        existing_products: 'update',
                        missing_products: 'ignore'
                    },
                    {
                        headers: { 'Content-Type': 'application/json' },
                        timeout
                    }
                );

                if (isRateLimit(data, null)) {
                    attempt++;
                    console.warn(`⏳ ${label}: rate limit, чекаємо ${RATE_LIMIT_DELAY_MS / 1000}s (спроба ${attempt}/${MAX_RETRIES})...`);
                    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
                    continue;
                }

                if (data.status && data.status !== 'OK') {
                    if (data.status === 'WARNING') {
                        console.warn(`⚠️  ${label} warning:`, data.response?.log);
                    } else {
                        console.error(`❌ ${label} finished with status ${data.status}`);
                    }
                    responses.push({ status: data.status, response: data });
                } else {
                    console.log(`✅ ${label} imported successfully.`);
                    responses.push({ status: 'SUCCESS', response: data });
                }
                pushed = true;
            } catch (err) {
                if (isRateLimit(null, err)) {
                    attempt++;
                    console.warn(`⏳ ${label}: rate limit (HTTP 429), чекаємо ${RATE_LIMIT_DELAY_MS / 1000}s (спроба ${attempt}/${MAX_RETRIES})...`);
                    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
                    continue;
                }

                const errData = err.response?.data?.response || err.response?.data;

                if (err.response) {
                    console.error(`❌ HTTP error for ${label}:`, errData);
                    responses.push({ status: 'HTTP_ERROR', response: errData });
                } else {
                    console.error(`❌ Network error for ${label}:`, err.message);
                    responses.push({ status: 'ERROR', message: err.message });
                }
                pushed = true;
            }
        }

        if (!pushed) {
            console.error(`❌ ${label}: вичерпано ${MAX_RETRIES} спроби через rate limit, пропускаємо.`);
            responses.push({ status: 'RATE_LIMIT_EXCEEDED', skipped: true });
        }

        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    const resultPath = path.join(OUT_DIR, 'result.json');

    if (IS_LOCAL) {
        fs.writeFileSync(resultPath, JSON.stringify(responses, null, 2), 'utf8');
        console.log(`✔ Результат записан в ${resultPath}`);
    } else {
        console.log('RESULTS >>>', JSON.stringify(responses, null, 2));
    }

    return responses;
}