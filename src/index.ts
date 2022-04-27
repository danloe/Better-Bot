import fs from 'node:fs';
import { Client, Collection, Intents } from 'discord.js';
import discordModals from 'discord-modals';
import dotenv from 'dotenv';
dotenv.config();

// CLIENT
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

discordModals(client);

// COMMANDS
const commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter((file: string) => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.set(command.data.name, command);
}

// EVENTS
const eventFiles = fs.readdirSync('./events').filter((file: string) => file.endsWith('.js'));

for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args: any) => event.execute(...args));
	}
	else {
		client.on(event.name, (...args: any) => event.execute(...args));
	}
}

// LOGIN
client.login(process.env.BOT_TOKEN);