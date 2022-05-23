import { Command, Playlist } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BetterClient from '../../client';
import {
    checkEmbedString as getPrettyEmbedString,
    createEmbed,
    createErrorEmbed,
    getTrackTypeColor,
    getTrackTypeString as getTrackSourceString,
    safeReply,
    secondsToDurationString
} from '../../helpers';
import { Track, TrackType } from '../../classes';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play or Queue a Song.')
        .addStringOption((option) =>
            option
                .setName('input')
                .setDescription('URL to a File, Search Text or YouTube Playlist')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption((option) =>
            option
                .setName('mode')
                .setDescription('Skip current track or play next?')
                .setRequired(false)
                .addChoices({ name: 'skip', value: 'skip' }, { name: 'next', value: 'next' })
        )
        .addBooleanOption((option) =>
            option.setName('announce').setDescription('Announce the track with TTS voice.').setRequired(false)
        ),
    run: (
        client: BetterClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) =>
        new Promise<void>(async (done, error) => {
            if (interaction) {
                try {
                    const input =
                        interaction instanceof CommandInteraction ? interaction.options.getString('input') : '';
                    let mode =
                        interaction instanceof CommandInteraction ? interaction.options.getString('mode') : undefined;
                    let announce =
                        interaction instanceof CommandInteraction ? interaction.options.getBoolean('announce') : false;
                    let skip = false;
                    let next = false;
                    if (mode) {
                        if (mode === 'skip') skip = true;
                        if (mode === 'next') next = true;
                    }
                    if (!announce) announce = false;

                    const result: Track | Playlist = await client.musicManager.play(
                        interaction,
                        input!,
                        announce,
                        skip,
                        next
                    );

                    let addedText = '';
                    if (result instanceof Track) {
                        if (skip) {
                            addedText =
                                '`➕ Track is playing now [' +
                                (client.musicManager.queues.get(interaction.guildId!)!.length - 1) +
                                ' in queue]`';
                        } else if (next) {
                            addedText =
                                '`➕ Track is next in queue [' +
                                client.musicManager.queues.get(interaction.guildId!)!.length +
                                ' in queue]`';
                        } else {
                            addedText =
                                '`➕ Track was added [' +
                                client.musicManager.queues.get(interaction.guildId!)!.length +
                                ' in queue]`';
                        }
                        await safeReply(
                            interaction,
                            createEmbed(
                                result.name,
                                addedText,
                                false,
                                getTrackTypeColor(result.type),
                                [
                                    { name: 'Description', value: getPrettyEmbedString(result.description) },
                                    { name: 'Source', value: getTrackSourceString(result), inline: true },
                                    { name: 'Duration', value: secondsToDurationString(result.duration), inline: true },
                                    { name: 'Uploaded', value: getPrettyEmbedString(result.uploaded), inline: true }
                                ],
                                result.artworkUrl,
                                result.displayUrl,
                                {
                                    text: `Requested by ${interaction.user.username}` + (result.announce ? ' 📣' : ''),
                                    iconURL: interaction.user.avatarURL() || undefined
                                }
                            )
                        );
                    } else {
                        // Playlist
                        if (skip) {
                            addedText =
                                '`➕ Playlist added and is playing now [' +
                                (client.musicManager.queues.get(interaction.guildId!)!.length - 1) +
                                ' in queue]`';
                        } else if (next) {
                            addedText =
                                '`➕ Playlist is next in queue [' +
                                client.musicManager.queues.get(interaction.guildId!)!.length +
                                ' in queue]`';
                        } else {
                            addedText =
                                '`➕ Playlist was added [' +
                                client.musicManager.queues.get(interaction.guildId!)!.length +
                                ' in queue]`';
                        }
                        await safeReply(
                            interaction,
                            createEmbed(
                                result.name,
                                addedText,
                                false,
                                getTrackTypeColor(TrackType.YouTube),
                                [
                                    { name: 'Description', value: getPrettyEmbedString(result.description) },
                                    { name: 'Channel', value: getPrettyEmbedString(result.channelTitle), inline: true },
                                    {
                                        name: 'Videos',
                                        value: getPrettyEmbedString(String(result.itemCount)),
                                        inline: true
                                    },
                                    {
                                        name: 'Published At',
                                        value: getPrettyEmbedString(String(result.publishedAt).split('T')[0]),
                                        inline: true
                                    }
                                ],
                                result.thumbnailUrl,
                                result.url,
                                {
                                    text: `Requested by ${interaction.user.username}` + (result.announce ? ' 📣' : ''),
                                    iconURL: interaction.user.avatarURL() || undefined
                                }
                            )
                        );
                    }

                    done();
                } catch (err) {
                    try {
                        await safeReply(interaction, createErrorEmbed('🚩 Error adding track(s): `' + err + '`'));
                    } catch (err2) {
                        console.log(err2);
                    }
                    console.log(err);
                    error(err);
                }
            }
        })
};
