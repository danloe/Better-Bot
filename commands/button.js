const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
// const wait = require('node:timers/promises').setTimeout;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('button')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {
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