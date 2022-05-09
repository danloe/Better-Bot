import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BetterClient from '../../client';
import { createEmbed, createErrorEmbed, getTrackTypeColor, getTrackTypeString } from '../../helpers';
import { Track } from '../../classes/Track';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play or Queue a Song.')
        .addStringOption((option) =>
            option.setName('input').setDescription('URL to a File or Search Text').setRequired(true)
        ),
    run: async (
        client: BetterClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) => {
        if (interaction) {
            if (interaction instanceof CommandInteraction) return;
            const input = interaction instanceof CommandInteraction ? interaction.options.getString('input') : '';
            await client.musicManager
                .addMedia(interaction, input!, false)
                .then(async (track: Track) => {
                    await interaction.followUp(
                        createEmbed(
                            track.name,
                            '✅ `' +
                                track.name +
                                '` was added to the queue `[' +
                                client.musicManager.queues.get(interaction.guildId!)!.length +
                                ' total]`',
                            false,
                            getTrackTypeColor(track.type),
                            [
                                { name: 'Description', value: track.description },
                                { name: 'Type', value: getTrackTypeString(track.type), inline: true },
                                { name: 'Duration', value: track.duration, inline: true },
                                { name: 'Uploaded', value: track.uploaded, inline: true }
                            ],
                            track.artworkUrl,
                            track.url,
                            {
                                text: `Requested by ${interaction.user.username}`,
                                iconURL: interaction.user.avatarURL() || undefined
                            }
                        )
                    );
                })
                .catch((err) => {
                    interaction.editReply(createErrorEmbed('🚩 Error adding track: `' + err + '`'));
                });
            if (message) {
                //NOT PLANNED
            }
        }
    }
};
