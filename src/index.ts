import { Intents } from 'discord.js';
import dotenv from 'dotenv';
import BetterClient from './client';
dotenv.config();

// CLIENT
const client = new BetterClient({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});

client.init();
