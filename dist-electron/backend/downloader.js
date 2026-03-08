"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadFile = downloadFile;
exports.getModelPath = getModelPath;
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
async function downloadFile(url, destPath, onProgress) {
    const dir = path_1.default.dirname(destPath);
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
    const { data, headers } = await (0, axios_1.default)({
        url,
        method: 'GET',
        responseType: 'stream'
    });
    const totalLength = parseInt(headers['content-length'], 10);
    let completedLength = 0;
    const writer = fs_1.default.createWriteStream(destPath);
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
function getModelPath(category, modelName) {
    return path_1.default.join(electron_1.app.getPath('userData'), 'models', category, modelName);
}
