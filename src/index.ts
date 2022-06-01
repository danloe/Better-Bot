import chalk from 'chalk';
import { Intents } from 'discord.js';
import dotenv from 'dotenv';
import BotterinoClient from './client';
dotenv.config();

try {
    // CLIENT
    if (!process.env.BOT_TOKEN || process.env.BOT_TOKEN!.length < 30) {
        console.log(chalk.red(`Discord Bot Token seems to be missing! Add BOT_TOKEN="YOURTOKEN" to .env file.`));
        process.exit(9);
    }
    const client = new BotterinoClient({
        intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES]
    });

    client.init();
} catch (error) {
    console.error(error);
}
