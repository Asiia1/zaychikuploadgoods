import axios from 'axios';
import fs from 'node:fs';
import path from 'node:path';
import { IMPORT_URL, IS_LOCAL, OUT_DIR } from '../config.js';

export async function importToHoroshop(token, products) {
    const batchSize = 5000;
    const timeout = 15 * 60 * 1000;
    const responses = [];

    for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);

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

            if (data.status && data.status !== 'OK') {
                let status = data.status;

                if (data.response?.code === 429) {
                    status = 'You hour requests limit has been exceeded.';
                    console.error(`Batch ${i + 1}-${i + batch.length}: ${status}`, data.response);
                } else if (status === 'WARNING') {
                    console.warn(`Batch ${i + 1}-${i + batch.length} warning:`, data.response?.log);
                } else {
                    console.error(`Batch ${i + 1}-${i + batch.length} finished with status ${status}`);
                }

                responses.push({ status, response: data });
            } else {
                console.log(`✅ Batch ${i + 1}-${i + batch.length} imported successfully.`);
                responses.push({ status: 'SUCCESS', response: data });
            }
        } catch (err) {
            const errData = err.response?.data?.response || err.response?.data;

            if (errData?.code === 429) {
                console.error(`❌ Rate limit exceeded for batch ${i + 1}-${i + batch.length}:`, errData);
                responses.push({
                    status: 'You hour requests limit has been exceeded.',
                    response: errData
                });
            } else if (err.response) {
                console.error(`❌ HTTP error for batch ${i + 1}-${i + batch.length}:`, errData);
                responses.push({ status: 'HTTP_ERROR', response: errData });
            } else {
                console.error(`❌ Network/error for batch ${i + 1}-${i + batch.length}:`, err.message);
                responses.push({ status: 'ERROR', message: err.message });
            }
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