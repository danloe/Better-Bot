import { Command } from '../../interfaces';
import { CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { Modal, TextInputComponent, showModal } from 'discord-modals';
import BetterClient from '../../client';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play or Queue a Song.')
        .addStringOption((option) =>
            option
                .setName('input')
                .setDescription('URL to a File or Search Text')
                .setRequired(false)
        ),
    run: async (client: BetterClient, interaction?: CommandInteraction, message?: Message, args?: string[]) => {
        if (interaction) {
            const input = interaction.options.getString('input');
            if (input) {
                //validate input
            } else {
                //open modal
                const modal = new Modal()
                    .setCustomId('modal-play')
                    .setTitle('Play or queue media.')
                    .addComponents(
                        new TextInputComponent()
                            .setCustomId('input')
                            .setLabel('YouTube 🔗/🔎  |  SoundCloud/Newgrounds 🔗')
                            .setStyle('SHORT')
                            .setPlaceholder('URL or Search Text...')
                            .setRequired(true)
                    );

                showModal(modal, {
                    client: interaction.client,
                    interaction: interaction
                });
            }
        }

        if (message) {
            //message!.channel.send(`${message!.client.ws.ping}ms ping. 🏓`);
        }
    }
};
