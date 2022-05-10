import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BetterClient from '../../client';
import {
    checkEmbedString,
    createEmbed,
    createErrorEmbed,
    getTrackTypeColor,
    getTrackTypeString as getTrackSourceString,
    replyInteraction,
    secondsToDurationString
} from '../../helpers';
import { Track } from '../../classes/Track';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play or Queue a Song.')
        .addStringOption((option) =>
            option.setName('input').setDescription('URL to a File or Search Text').setRequired(true)
        ),
    run: (
        client: BetterClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) => {
        new Promise<void>(async (done, error) => {
            if (interaction) {
                try {
                    const input =
                        interaction instanceof CommandInteraction ? interaction.options.getString('input') : '';
                    const track = await client.musicManager.play(interaction, input!, false);
                    await replyInteraction(
                        interaction,
                        createEmbed(
                            track.name,
                            '`➕ Track was added [' +
                                client.musicManager.queues.get(interaction.guildId!)!.length +
                                ' in queue]`',
                            false,
                            getTrackTypeColor(track.type),
                            [
                                { name: 'Description', value: checkEmbedString(track.description) },
                                { name: 'Source', value: getTrackSourceString(track), inline: true },
                                { name: 'Duration', value: secondsToDurationString(track.duration), inline: true },
                                { name: 'Uploaded', value: checkEmbedString(track.uploaded), inline: true }
                            ],
                            track.artworkUrl,
                            track.displayUrl,
                            {
                                text: `Requested by ${interaction.user.username}`,
                                iconURL: interaction.user.avatarURL() || undefined
                            }
                        )
                    );
                    done();
                } catch (err) {
                    try {
                        await replyInteraction(interaction, createErrorEmbed('🚩 Error adding track: `' + err + '`'));
                    } catch (err2) {
                        console.log(err2);
                    }
                    console.log(err);
                    error(err);
                }

                if (message) {
                    //NOT PLANNED
                }
            }
        });
    }
};
