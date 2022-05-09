import { Command } from '../../interfaces';
import { CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BetterClient from '../../client';
import { createEmbed, createErrorEmbed, getTrackTypeColor } from '../../helpers';
import { Track } from '../../classes/Track';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip to the next track, or further.')
        .addNumberOption((option) =>
            option.setName('input').setDescription('Skip how many tracks?').setRequired(false)
        ),
    run: async (client: BetterClient, interaction?: CommandInteraction, message?: Message, args?: string[]) => {
        if (interaction) {
            let input = interaction.options.getNumber('input');
            if (!input) input = 1;
            await client.musicManager
                .skip(interaction, input)
                .then(async () => {
                    await interaction.editReply(
                        createEmbed(
                            'Skipped',
                            '✅ `' +
                                input +
                                (input == 1 ? '` track' : '` tracks') +
                                ' skipped `[' +
                                client.musicManager.queues.get(interaction.guildId!)!.length +
                                ' more in queue]`',
                            false
                        )
                    );
                });
            if (message) {
                //message!.channel.send(`${message!.client.ws.ping}ms ping. 🏓`);
            }
        }
    }
};
