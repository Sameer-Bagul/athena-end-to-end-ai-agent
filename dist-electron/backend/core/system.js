import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import { homedir } from "os";
const execAsync = promisify(exec);
export const systemService = {
    /**
     * Set system volume (0-100)
     */
    async setVolume(percent) {
        try {
            const val = Math.max(0, Math.min(100, percent));
            await execAsync(`amixer sset Master ${val}%`);
            return `Volume set to ${val}%`;
        }
        catch (error) {
            console.error("System Volume Error:", error);
            return `Error setting volume: ${error.message}. Is 'amixer' installed?`;
        }
    },
    /**
     * Get system volume
     */
    async getVolume() {
        try {
            const { stdout } = await execAsync("amixer sget Master");
            const match = stdout.match(/\[(\d+)%\]/);
            return match ? parseInt(match[1]) : "Unknown";
        }
        catch (error) {
            return "Error";
        }
    },
    /**
     * Set display brightness (0-100)
     */
    async setBrightness(percent) {
        try {
            const val = Math.max(0, Math.min(100, percent));
            await execAsync(`brightnessctl set ${val}%`);
            return `Brightness set to ${val}%`;
        }
        catch (error) {
            console.error("System Brightness Error:", error);
            return `Error setting brightness: ${error.message}. Ensure 'brightnessctl' is installed.`;
        }
    },
    /**
     * Get laptop battery info
     */
    async getBatteryInfo() {
        try {
            const capacity = (await execAsync("cat /sys/class/power_supply/BAT0/capacity")).stdout.trim();
            const status = (await execAsync("cat /sys/class/power_supply/BAT0/status")).stdout.trim();
            return `Battery: ${capacity}% (${status})`;
        }
        catch (error) {
            return "Battery info unavailable on this system or not a laptop.";
        }
    },
    /**
     * List files in a directory
     */
    async listFiles(targetPath) {
        try {
            const resolvedPath = targetPath.startsWith('~')
                ? path.join(homedir(), targetPath.slice(1))
                : path.resolve(targetPath);
            const entries = await fs.readdir(resolvedPath, { withFileTypes: true });
            return entries.map(entry => ({
                name: entry.name,
                isDirectory: entry.isDirectory(),
                size: 0, // Incomplete stats for speed
                path: path.join(resolvedPath, entry.name)
            }));
        }
        catch (error) {
            console.error("List Files Error:", error);
            throw new Error(`Failed to list files: ${error.message}`);
        }
    },
    /**
     * Read file content
     */
    async readFile(targetPath) {
        try {
            const resolvedPath = targetPath.startsWith('~')
                ? path.join(homedir(), targetPath.slice(1))
                : path.resolve(targetPath);
            const content = await fs.readFile(resolvedPath, 'utf-8');
            return content;
        }
        catch (error) {
            console.error("Read File Error:", error);
            throw new Error(`Failed to read file: ${error.message}`);
        }
    },
    /**
     * Get detailed file stats
     */
    async getFileStats(targetPath) {
        try {
            const resolvedPath = targetPath.startsWith('~')
                ? path.join(homedir(), targetPath.slice(1))
                : path.resolve(targetPath);
            const stats = await fs.stat(resolvedPath);
            return {
                size: stats.size,
                atime: stats.atime,
                mtime: stats.mtime,
                ctime: stats.ctime,
                birthtime: stats.birthtime,
                isDirectory: stats.isDirectory(),
                isFile: stats.isFile()
            };
        }
        catch (error) {
            console.error("File Stats Error:", error);
            throw new Error(`Failed to get file stats: ${error.message}`);
        }
    }
};
