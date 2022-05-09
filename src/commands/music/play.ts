import { Command } from '../../interfaces';
import { CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BetterClient from '../../client';
import { createEmbed, createErrorEmbed, getTrackTypeColor } from '../../helpers';
import { Track } from '../../classes/Track';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play or Queue a Song.')
        .addStringOption((option) =>
            option.setName('input').setDescription('URL to a File or Search Text').setRequired(true)
        ),
    run: async (client: BetterClient, interaction?: CommandInteraction, message?: Message, args?: string[]) => {
        if (interaction) {
            const input = interaction.options.getString('input');
            await client.musicManager
                .addMedia(interaction, input!, false)
                .then(async (track: Track) => {
                    await interaction.followUp(
                        createEmbed(
                            'Added',
                            '✅ `' +
                                track.name +
                                '` was added to the queue `[' +
                                client.musicManager.queues.get(interaction.guildId!)!.length +
                                ' total]`',
                            false,
                            getTrackTypeColor(track.type)
                        )
                    );
                })
                .catch((err) => {
                    interaction.editReply(createErrorEmbed('🚩 Error adding track: `' + err + '`'));
                });
            if (message) {
                //message!.channel.send(`${message!.client.ws.ping}ms ping. 🏓`);
            }
        }
    }
};
