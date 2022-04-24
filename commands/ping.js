const { SlashCommandBuilder } = require('@discordjs/builders');
const { Modal, TextInputComponent, showModal } = require('discord-modals');
// const wait = require('node:timers/promises').setTimeout;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {
		// await interaction.deferReply();
		// await wait(4000);
		// await interaction.editReply('Pong! 🏓');

		const modal = new Modal()
			.setCustomId('modal-customid')
			.setTitle('Play music.')
			.addComponents(
				new TextInputComponent()
					.setCustomId('textinput-customid1')
					.setLabel('YouTube 🔗/🔎  |  SoundCloud/Newgrounds 🔗')
					.setStyle('SHORT')
					.setPlaceholder('URL or Search Keywords...')
					.setRequired(true),
			);

		showModal(modal, {
			client: interaction.client,
			interaction: interaction,
		});
	},
};