const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
// const wait = require('node:timers/promises').setTimeout;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('button')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {
		const filter = i => i.customId === 'ping';
		const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });
		collector.on('collect', async i => {
			if (i.customId === 'ping') {
				await i.update({ content: 'Pong! 🏓', components: [] });
				// await interaction.client.commands.get('ping').execute(interaction);
			}
		});

		collector.on('end', collected => console.log(`Collected ${collected.size} items`));

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