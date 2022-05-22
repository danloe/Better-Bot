import { Command } from '../../interfaces';
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

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play or Queue a Song.')
        .addStringOption((option) =>
            option
                .setName('input')
                .setDescription('URL to a File or Search Text')
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
                    const track = await client.musicManager.play(interaction, input!, announce, skip, next);
                    let addedText = '';
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
                            track.name,
                            addedText,
                            false,
                            getTrackTypeColor(track.type),
                            [
                                { name: 'Description', value: getPrettyEmbedString(track.description) },
                                { name: 'Source', value: getTrackSourceString(track), inline: true },
                                { name: 'Duration', value: secondsToDurationString(track.duration), inline: true },
                                { name: 'Uploaded', value: getPrettyEmbedString(track.uploaded), inline: true }
                            ],
                            track.artworkUrl,
                            track.displayUrl,
                            {
                                text: `Requested by ${interaction.user.username}` + (track.announce ? ' 📣' : ''),
                                iconURL: interaction.user.avatarURL() || undefined
                            }
                        )
                    );
                    done();
                } catch (err) {
                    try {
                        await safeReply(interaction, createErrorEmbed('🚩 Error adding track: `' + err + '`'));
                    } catch (err2) {
                        console.log(err2);
                    }
                    console.log(err);
                    error(err);
                }
            }
        })
};
