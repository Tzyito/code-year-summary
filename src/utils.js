import fs from "fs/promises";
import chalk from "chalk";
import path from "path";

export async function ensureDirectoryExists(dirPath) {
    try {
        const normalizedPath = path.resolve(dirPath);
        await fs.mkdir(normalizedPath, { recursive: true });
        return {
            success: true,
            _path: normalizedPath
        };
    } catch (error) {
        console.log(chalk.red(`\nFailed to create directory: ❌ ${error.message}`));
        return {
            success: false,
            error: error.message,
            _path: dirPath
        };
    }
}
