import chalk from 'chalk';
import BotterinoClient from '../client';

export class Logger {
    client: BotterinoClient;

    constructor(client: BotterinoClient) {
        this.client = client;
    }

    log(message: string, ...args: any[]) {
        if (this.client.config.debug || this.client.config.verbose) console.log(this.getMessage(message), ...args);
        this.writeToFile(`[LOG] ${message}`);
    }

    error(message: string, ...args: any[]) {
        console.error(`${chalk.bgRed.black('[ERROR]')} ${this.getMessage(message)}`, ...args);
        this.writeToFile(`[ERROR] ${message}`);
    }

    warn(message: string, ...args: any[]) {
        console.warn(`${chalk.bgYellow.black('[WARN]')} ${this.getMessage(message)}`, ...args);
        this.writeToFile(`[WARN] ${message}`);
    }

    info(message: string, ...args: any[]) {
        if (this.client.config.debug || this.client.config.verbose)
            console.info(`${chalk.bgWhite.black('[INFO]')} ${this.getMessage(message)}`, ...args);
    }

    debug(message: string, ...args: any[]) {
        if (this.client.config.debug)
            console.debug(`${chalk.bgCyanBright('[DEBUG]')} ${this.getMessage(message)}`, ...args);
    }

    trace(message: string, ...args: any[]) {
        if (this.client.config.debug)
            console.trace(`${chalk.bgBlueBright('[TRACE]')} ${this.getMessage(message)}`, ...args);
    }

    private getMessage(message: string) {
        return `[${new Date().toLocaleString()}] ${message}`;
    }

    private writeToFile(message: string) {
        return new Promise<void>((resolve, reject) => {
            const fs = require('fs');
            fs.appendFile('logs.txt', `[${new Date().toLocaleString()}] ${message}\n`, (err: any) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}
