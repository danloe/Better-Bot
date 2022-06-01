import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import dotenv from 'dotenv';
dotenv.config();

const rest = new REST({ version: '9' }).setToken(process.env.BOT_TOKEN as string);

rest.put(Routes.applicationCommands(process.env.CLIENT_ID as string), {
    body: []
})
    .then(() => console.log('Successfully cleared application commands.'))
    .catch(console.error);
