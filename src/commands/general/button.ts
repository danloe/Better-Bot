import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageActionRow, MessageButton } from 'discord.js';
// const wait = require('node:timers/promises').setTimeout;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('button')
		.setDescription('Replies with Pong!'),
	async execute(interaction : any) {
		const row = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId('ping')
					.setLabel('Ping! 🏓')
					.setStyle('PRIMARY'),
			);
		await interaction.reply({ content: ' ', components: [row] });
	},
};