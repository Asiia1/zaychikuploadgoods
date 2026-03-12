import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

export const FEED_URL = process.env.TOYSI_FEED_URL;
if (!FEED_URL) {
    console.error('❌ Не задан TOYSI_FEED_URL. Укажи в .env или Secrets.');
    process.exit(1);
}

export const OUT_DIR = process.env.OUTPUT_DIR || path.join(ROOT_DIR, 'feeds', 'toysi');
export const TIMEOUT_MS = 180_000;
export const MAX_ITEMS = Number(process.env.MAX_ITEMS || 0);

await fs.promises.mkdir(OUT_DIR, { recursive: true });