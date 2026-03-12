import { FEED_URL } from './src/config.js';
import { downloadFeed } from './src/downloader/downloadFeed.js';
import { parseXmlToJson } from './src/parser/parseXmlToJson.js';
import { writeLatestCopy } from './src/utils/fs.js';

(async () => {
    try {
        const xmlPath = await downloadFeed(FEED_URL);
        const { jsonPath } = await parseXmlToJson(xmlPath);

        const latestPath = await writeLatestCopy(jsonPath);
        console.log(`🔖 Обновлён latest: ${latestPath}`);
    } catch (e) {
        console.error('❌ Ошибка:', e.message);
        process.exit(1);
    }
})();