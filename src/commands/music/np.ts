import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message, MessageActionRow, MessageEmbed } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BotterinoClient from '../../client';
import { createEmbed, createErrorEmbed, getNowPlayingMessage, safeReply } from '../../helpers';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('np')
        .setDescription('Enable/Disable now playing message when a song starts.')
        .addBooleanOption((option) => option.setName('set').setDescription('Enable?').setRequired(false))
        .addChannelOption((option) =>
            option.setName('channel').setDescription('Bind message to a specific channel.').setRequired(false)
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
                    let input =
                        interaction instanceof CommandInteraction ? interaction.options.getBoolean('set') : undefined;
                    let channel =
                        interaction instanceof CommandInteraction
                            ? interaction.options.getChannel('channel')
                            : undefined;

                    const subscription = client.musicManager.getSubscription(interaction, false);

                    let message = '';

                    if (input !== null) {
                        subscription.setMessageDisplay(input);
                        message = '`🔺 Is now turned ' + (input ? 'on.`' : 'off.`');
                    }

                    if (channel) {
                        if (channel.type === 'GUILD_TEXT') {
                            subscription.lastChannel = channel;
                            message += (input !== null ? '\n`' : '`') + '🔺 Bound to #' + channel.name + '`';
                        }
                    }

                    if (subscription.currentTrack) {
                        let [embedmsg, row] = getNowPlayingMessage(
                            subscription.currentTrack,
                            subscription.queue,
                            subscription?.audioPlayer,
                            subscription.audioResource?.playbackDuration
                        );
                        await safeReply(interaction, {
                            embeds: [embedmsg],
                            components: [row]
                        });
                        if (input !== null || channel)
                            await safeReply(interaction, createEmbed('Now Playing Message', message, true), true);
                    } else {
                        if (input !== null || channel)
                            await safeReply(interaction, createEmbed('Now Playing Message', message, true));
                    }

                    done();
                } catch (err) {
                    await safeReply(interaction, createErrorEmbed('🚩 Error setting the volume: `' + err + '`', true));
                    error(err);
                }
            }
        })
};
