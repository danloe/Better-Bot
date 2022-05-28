import { Command, Playlist, PlaylistType } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, GuildTextBasedChannel, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BotterinoClient from '../../client';
import {
    checkEmbedString as getPrettyEmbedString,
    createEmbed,
    createErrorEmbed,
    getTrackTypeColor,
    getTrackSourceString as getTrackSourceString,
    safeReply,
    secondsToDurationString,
    getTrackTypeString
} from '../../helpers';
import { Track, InputType } from '../../classes';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play or Queue a Song.')
        .addStringOption((option) =>
            option
                .setName('input')
                .setDescription('URL to File, YouTube, Spotify, SoundCloud, Newgrounds or Search Text')
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
            option.setName('announce').setDescription('Announce the track(s) with TTS voice?').setRequired(false)
        )
        .addBooleanOption((option) =>
            option.setName('reverse').setDescription('Playlists only: Reverse items?').setRequired(false)
        )
        .addBooleanOption((option) =>
            option.setName('shuffle').setDescription('Playlists only: Shuffle items?').setRequired(false)
        )
        .addIntegerOption((option) =>
            option
                .setName('offset')
                .setDescription('Playlists only: Start track offset?')
                .setMinValue(1)
                .setRequired(false)
        )
        .addIntegerOption((option) =>
            option.setName('limit').setDescription('Playlists only: How many tracks?').setMinValue(1).setRequired(false)
        ),
    run: (
        client: BotterinoClient,
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
                    let reverse =
                        interaction instanceof CommandInteraction ? interaction.options.getBoolean('reverse') : false;
                    let shuffle =
                        interaction instanceof CommandInteraction ? interaction.options.getBoolean('shuffle') : false;
                    let offset =
                        interaction instanceof CommandInteraction ? interaction.options.getInteger('offset') : 0;
                    let limit =
                        interaction instanceof CommandInteraction
                            ? interaction.options.getInteger('limit')
                            : Number.POSITIVE_INFINITY;
                    let skip = false;
                    let next = false;
                    if (mode) {
                        if (mode === 'skip') skip = true;
                        if (mode === 'next') next = true;
                    }
                    if (!announce) announce = false;
                    if (!reverse) reverse = false;
                    if (!shuffle) shuffle = false;
                    if (!offset) offset = 0;
                    if (!limit) limit = Number.POSITIVE_INFINITY;

                    const result: Track | Playlist = await client.musicManager.play(
                        interaction,
                        input!,
                        announce,
                        skip,
                        next,
                        reverse,
                        shuffle,
                        offset,
                        limit
                    );

                    let addedText = '';
                    if (result instanceof Track) {
                        if (skip) {
                            addedText =
                                '`🔺 Track is playing now [' +
                                (client.musicManager.queues.get(interaction.guildId!)!.length - 1) +
                                ' in queue]`';
                        } else if (next) {
                            addedText =
                                '`🔺 Track is next in queue [' +
                                client.musicManager.queues.get(interaction.guildId!)!.length +
                                ' in queue]`';
                        } else {
                            addedText =
                                '`🔺 Track was added [' +
                                client.musicManager.queues.get(interaction.guildId!)!.length +
                                ' in queue]`';
                        }
                        await safeReply(
                            interaction,
                            createEmbed(
                                result.name,
                                addedText,
                                false,
                                getTrackTypeColor(result.inputType),
                                [
                                    { name: 'Description', value: getPrettyEmbedString(result.description) },
                                    { name: 'Track Source', value: getTrackTypeString(result), inline: true },
                                    { name: 'Audio Source', value: getTrackSourceString(result), inline: true },
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
                                '`🔺 Playlist added and is playing now [' +
                                (client.musicManager.queues.get(interaction.guildId!)!.length - 1) +
                                ' in queue]`';
                        } else if (next) {
                            addedText =
                                '`🔺 Playlist is next in queue [' +
                                client.musicManager.queues.get(interaction.guildId!)!.length +
                                ' in queue]`';
                        } else {
                            addedText =
                                '`🔺 Playlist was added [' +
                                client.musicManager.queues.get(interaction.guildId!)!.length +
                                ' in queue]`';
                        }
                        await safeReply(
                            interaction,
                            createEmbed(
                                result.name,
                                addedText,
                                false,
                                getTrackTypeColor(
                                    result.type === PlaylistType.YouTube
                                        ? InputType.YouTubePlaylist
                                        : InputType.SpotifyPlaylist
                                ),
                                [
                                    { name: 'Description', value: getPrettyEmbedString(result.description) },
                                    { name: 'Owner', value: getPrettyEmbedString(result.owner), inline: true },
                                    {
                                        name: result.type === PlaylistType.YouTube ? 'Videos' : 'Tracks',
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

                    let subscription = client.musicManager.getSubscription(interaction, false);
                    if (subscription.lastChannel?.id != interaction.channel?.id) {
                        subscription.lastChannel = <GuildTextBasedChannel>interaction.channel;
                        await safeReply(
                            interaction,
                            createEmbed(
                                'Now Playing Message',
                                '`🔺 The now playing message is now bound to #' + subscription.lastChannel.name + '`',
                                true
                            ),
                            true
                        );
                    }

                    done();
                } catch (err) {
                    await safeReply(interaction, createErrorEmbed('🚩 Error adding track(s): `' + err + '`', true));
                    error(err);
                }
            }
        })
};
