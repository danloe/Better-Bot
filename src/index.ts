import { Intents } from 'discord.js';
import dotenv from 'dotenv';
import BetterClient from './client';
dotenv.config();

try {
    // CLIENT
    const client = new BetterClient({
        intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES]
    });

    client.init();

    process.on('unhandledRejection', (reason, p) => {
        console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
        // application specific logging, throwing an error, or other logic here
    });
} catch (error) {
    console.log(error);
}
