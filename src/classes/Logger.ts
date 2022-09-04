import chalk from 'chalk';

export class Logger {
    static log(message: string, ...args: any[]) {
        console.log(getMessage(message), ...args);
        writeToFile(`[LOG] ${message}`);
    }

    static error(message: string, ...args: any[]) {
        console.trace(`${chalk.bgRed.black('[ERROR]')} ${getMessage(message)}`, ...args);
        writeToFile(`[ERROR] ${message}`);
    }

    static warn(message: string, ...args: any[]) {
        console.warn(`${chalk.bgYellow.black('[WARN]')} ${getMessage(message)}`, ...args);
        writeToFile(`[WARN] ${message}`);
    }

    static info(message: string, ...args: any[]) {
        if (global.config.general.debug || global.config.general.verboseLogging)
            console.info(`${chalk.bgWhite.black('[INFO]')} ${getMessage(message)}`, ...args);
    }

    static debug(message: string, ...args: any[]) {
        if (global.config.general.debug)
            console.debug(`${chalk.bgCyanBright('[DEBUG]')} ${getMessage(message)}`, ...args);
    }

    static trace(message: string, ...args: any[]) {
        if (global.config.general.debug)
            console.trace(`${chalk.bgBlueBright('[TRACE]')} ${getMessage(message)}`, ...args);
    }
}

function getMessage(message: string) {
    return `[${new Date().toLocaleString()}] ${message}`;
}

function writeToFile(message: string) {
    if (global.config.general.disableWriteLog) return;
    return new Promise<void>((resolve, reject) => {
        const fs = require('fs');
        fs.appendFile('logs.txt', `[${new Date().toLocaleString()}] ${message}\n`, (err: any) => {
            if (err) reject(err);
            else resolve();
        });
    });
}
