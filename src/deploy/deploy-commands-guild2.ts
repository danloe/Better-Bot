import fs from 'node:fs';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import dotenv from 'dotenv';
dotenv.config();

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(process.env.BOT_TOKEN as string);

rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID as string, process.env.GUILD2_ID as string), { body: commands })
	.then(() => console.log('Successfully registered guild commands.'))
	.catch(console.error);