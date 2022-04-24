const fs = require('node:fs');
const { Client, Collection, Formatters, Intents } = require('discord.js');
const discordModals = require('discord-modals');
require('dotenv').config();

// CLIENT
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

discordModals(client);

// COMMANDS
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}

// EVENTS
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	}
	else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

// MODAL
client.on('modalSubmit', async (modal) => {
	if (modal.customId === 'modal-customid') {
		const firstResponse = modal.getTextInputValue('textinput-customid1');
		modal.reply(Formatters.codeBlock('markdown', firstResponse));
	}
});

// LOGIN
client.login(process.env.BOT_TOKEN);