import Client from './client';
import { Intents } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

// CLIENT
const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});

client.init();
