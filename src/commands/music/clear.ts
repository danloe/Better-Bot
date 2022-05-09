import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BetterClient from '../../client';
import { createEmbed, createErrorEmbed } from '../../helpers';

export const command: Command = {
    data: new SlashCommandBuilder().setName('clear').setDescription('Remove all tracks from the queue.'),
    run: async (client: BetterClient, interaction?: CommandInteraction | ButtonInteraction, message?: Message, args?: string[]) => {
        if (interaction) {
            await client.musicManager
                .clear(interaction)
                .then(async () => {
                    await interaction.editReply(createEmbed('Cleared', '✅ The Queue is now empty.', false));
                })
                .catch((err) => {
                    interaction.editReply(createErrorEmbed('🚩 Error clearing queue: `' + err + '`'));
                });
            if (message) {
                //NOT PLANNED
            }
        }
    }
};
