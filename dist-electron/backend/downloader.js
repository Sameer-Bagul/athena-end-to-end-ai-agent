import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
export async function downloadFile(url, destPath, onProgress) {
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const { data, headers } = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });
    const totalLength = parseInt(headers['content-length'], 10);
    let completedLength = 0;
    const writer = fs.createWriteStream(destPath);
    return new Promise((resolve, reject) => {
        data.on('data', (chunk) => {
            completedLength += chunk.length;
            const percent = Math.round((completedLength / totalLength) * 100);
            onProgress({
                total: totalLength,
                completed: completedLength,
                percent
            });
        });
        data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}
export function getModelPath(category, modelName) {
    return path.join(app.getPath('userData'), 'models', category, modelName);
}
