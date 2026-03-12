import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

export const FEED_URL = process.env.TOYSI_FEED_URL;
export const HOROSHOP_API_URL = process.env.HOROSHOP_API_URL;
export const HOROSHOP_LOGIN = process.env.HOROSHOP_LOGIN;
export const HOROSHOP_PASSWORD = process.env.HOROSHOP_PASSWORD;
export const IMPORT_URL = process.env.IMPORT_URL;

if (!FEED_URL) {
    console.error('❌ Не задан TOYSI_FEED_URL. Укажи в .env или Secrets.');
    process.exit(1);
}

if (!HOROSHOP_API_URL) {
    console.error('❌ Не задан HOROSHOP_API_URL.');
    process.exit(1);
}

if (!HOROSHOP_LOGIN) {
    console.error('❌ Не задан HOROSHOP_LOGIN.');
    process.exit(1);
}

if (!HOROSHOP_PASSWORD) {
    console.error('❌ Не задан HOROSHOP_PASSWORD.');
    process.exit(1);
}

if (!IMPORT_URL) {
    console.error('❌ Не задан IMPORT_URL.');
    process.exit(1);
}

export const OUT_DIR = process.env.OUTPUT_DIR || path.join(ROOT_DIR, 'feeds', 'toysi');
export const TIMEOUT_MS = 180_000;
export const MAX_ITEMS = Number(process.env.MAX_ITEMS || 0);
export const IS_LOCAL = !process.env.GITHUB_ACTIONS;

await fs.promises.mkdir(OUT_DIR, { recursive: true });