import chalk from 'chalk';
import { Intents } from 'discord.js';
import dotenv from 'dotenv';
import BotterinoClient from './client';
import express = require('express');
dotenv.config();

try {
    // WEB APP
    const app = express();

    app.use(express.static('web'));

    app.get('/', (req, res) => {
        return res.sendFile('index.html');
    });

    app.all('*', (req, res) => {
        res.status(404).sendFile('error404.html', { root: 'web' });
    });

    app.listen(process.env.PORT || 53134, () =>
        console.log(`App listening at http://localhost:${process.env.PORT || 53134}`)
    );

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
