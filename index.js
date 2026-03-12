import { FEED_URL } from './src/config.js';
import { getToken } from './src/auth/getToken.js';
import { downloadFeed } from './src/downloader/downloadFeed.js';
import { parseXmlToJson } from './src/parser/parseXmlToJson.js';
import { importToHoroshop } from './src/import/importToHoroshop.js';
import { writeLatestCopy } from './src/utils/fs.js';

function maskToken(token) {
    if (!token || token.length < 10) return '***';
    return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

(async () => {
    try {
        console.log('🚀 Запуск обновления товаров...');
        console.log('🔐 Запрашиваю токен авторизации...');

        const token = await getToken();
        console.log(`✅ Токен получен: ${maskToken(token)}`);

        const xmlPath = await downloadFeed(FEED_URL);
        console.log(`📥 XML загружен: ${xmlPath}`);

        const { jsonPath, products } = await parseXmlToJson(xmlPath);
        console.log(`🧩 Подготовлено товаров к импорту: ${products.length}`);

        try {
            await importToHoroshop(token, products);
            console.log('✅ Обновление товаров завершено');
        } catch (error) {
            console.error(`❌ Ошибка во время импорта товаров: ${error.message}`);
        }

        const latestPath = await writeLatestCopy(jsonPath);
        console.log(`🔖 Обновлён latest: ${latestPath}`);
    } catch (e) {
        console.error('❌ Ошибка пайплайна:', e.message);
        process.exit(1);
    }
})();