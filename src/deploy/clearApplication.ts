import { REST } from '@discordjs/rest';
import chalk from 'chalk';
import { Routes } from 'discord-api-types/v9';
import dotenv from 'dotenv';
dotenv.config();

const rest = new REST({ version: '9' }).setToken(process.env.BOT_TOKEN as string);

rest.put(Routes.applicationCommands(process.env.CLIENT_ID as string), {
    body: []
})
    .then(() => console.log(chalk.green('Successfully cleared application commands.')))
    .catch((err) => {
        console.error(chalk.red(err));
    });
