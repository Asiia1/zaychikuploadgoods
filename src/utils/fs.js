import fs from 'node:fs';
import path from 'node:path';
import { OUT_DIR } from '../config.js';

export async function writeLatestCopy(sourcePath, latestFileName = 'toysi-latest.json') {
    const latestPath = path.join(OUT_DIR, latestFileName);
    await fs.promises.copyFile(sourcePath, latestPath);
    return latestPath;
}