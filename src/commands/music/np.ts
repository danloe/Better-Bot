import { Command } from '../../interfaces';
import {
    ButtonInteraction,
    CommandInteraction,
    GuildTextBasedChannel,
    Interaction,
    Message,
    MessageActionRow,
    MessageButton,
    MessageEmbed
} from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BotterinoClient from '../../client';
import {
    createEmbed,
    createErrorEmbed,
    getTrackBarString,
    safeDeferReply,
    safeReply,
    secondsToColonsString
} from '../../helpers';
import { command as restart } from './restart';
import { command as stop } from './stop';
import { command as pause } from './pause';
import { command as resume } from './resume';
import { command as skip } from './skip';
import { command as repeat } from './repeat';
import { command as queueCommand } from './queue';
import { MusicSubscription } from '../../classes';
import { AudioPlayerStatus } from '@discordjs/voice';
import { APIMessage } from 'discord-api-types/v10';

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
                        interaction instanceof CommandInteraction ? interaction.options.getBoolean('set') : null;
                    let channel =
                        interaction instanceof CommandInteraction
                            ? interaction.options.getChannel('channel')
                            : undefined;

                    const subscription = client.musicManager.getSubscription(interaction, false);

                    let msgText = '';

                    if (input !== null) {
                        subscription.setMessageDisplay(input);
                        msgText = '`🔺 Is now turned ' + (input ? 'on`' : 'off`');
                    }

                    if (channel) {
                        if (channel.type === 'GUILD_TEXT') {
                            subscription.lastChannel = channel;
                            msgText += (input !== null ? '\n`' : '`') + '🔺 Bound to channel #' + channel.name + '`';
                        }
                    }

                    if (input !== null || channel) {
                        await safeReply(interaction, createEmbed('Now Playing Message', msgText, true), true);
                    } else {
                        startNowPlayingCollector(interaction, subscription);
                    }

                    done();
                } catch (err) {
                    await safeReply(interaction, createErrorEmbed('🚩 Error setting the volume: `' + err + '`', true));
                    error(err);
                }
            }
        })
};

export async function startNowPlayingCollector(
    message: Message | CommandInteraction | ButtonInteraction,
    subscription: MusicSubscription
) {
    const collector = message.channel!.createMessageComponentCollector({
        componentType: 'BUTTON',
        time: 60000
    });

    collector.on('collect', async (button) => {
        try {
            await safeDeferReply(button);
            collector.stop();
            switch (button.customId) {
                case 'np_restart':
                    await restart.run(subscription.client, button);
                    startNowPlayingCollector(subscription.lastNowPlayingMessage, subscription);
                    break;
                case 'np_stop':
                    await stop.run(subscription.client, button);
                    startNowPlayingCollector(subscription.lastNowPlayingMessage, subscription);
                    break;
                case 'np_pauseresume':
                    if (subscription.isPaused()) {
                        await resume.run(subscription.client, button);
                    } else {
                        await pause.run(subscription.client, button);
                    }
                    startNowPlayingCollector(subscription.lastNowPlayingMessage, subscription);
                    break;
                case 'np_skip':
                    await skip.run(subscription.client, button);
                    break;
                case 'np_repeat':
                    await repeat.run(subscription.client, button);
                    startNowPlayingCollector(subscription.lastNowPlayingMessage, subscription);
                    break;
                case 'np_queue':
                    await queueCommand.run(subscription.client, button);
                    startNowPlayingCollector(subscription.lastNowPlayingMessage, subscription);
                    break;
            }
        } catch (err) {
            console.log(err);
        }
    });

    collector.on('end', async (_, reason) => {
        if (reason === 'time') {
            try {
                const [msgembed, row] = getNowPlayingMessage(subscription);
                if (message instanceof Message) {
                    let msg = await message.fetch().catch((_) => {
                        return null;
                    });
                    if (msg !== null) {
                        message.edit({
                            embeds: [msgembed],
                            components: []
                        });
                    }
                } else {
                    let msg = await message.fetchReply().catch((_) => {
                        return null;
                    });
                    if (msg !== null) {
                        safeReply(message, {
                            embeds: [msgembed],
                            components: []
                        });
                    }
                }
            } catch (err) {
                console.log(err);
            }
        }
    });

    const [msgembed, row] = getNowPlayingMessage(subscription);

    let lastMessage!: Message | APIMessage;

    if (message instanceof Message) {
        let msg = await message?.channel?.messages?.fetch(message.id).catch((_) => {
            return null;
        });
        if (msg !== null) {
            if (msg?.deletable) await msg.delete();
        }
        lastMessage = await subscription.lastChannel.send({
            embeds: [msgembed],
            components: [row]
        });
    } else {
        let msg = await subscription.lastNowPlayingMessage?.fetch().catch((_) => {
            return null;
        });
        if (msg !== null) {
            if (msg?.deletable) await msg.delete();
        }
        lastMessage = <Message>await safeReply(message, {
            embeds: [msgembed],
            components: [row]
        });
    }
    subscription.lastNowPlayingMessage = lastMessage;
}

export function getNowPlayingMessage(subscription: MusicSubscription): [message: MessageEmbed, row: MessageActionRow] {
    let embedmsg = new MessageEmbed().setColor('#403075');

    if (subscription.currentTrack) {
        embedmsg
            .setTitle(subscription.currentTrack.name)
            .setURL(subscription.currentTrack.displayUrl)
            .setThumbnail(subscription.currentTrack.artworkUrl)
            .setDescription('`is now playing, requested by ' + subscription.currentTrack.requestor + '`');
    }

    if (!isNaN(subscription.currentTrack?.duration!) && subscription.currentTrack?.duration! > 0) {
        embedmsg.addField(
            '\u200B',
            '`' +
                secondsToColonsString(Math.floor(subscription.audioResource.playbackDuration / 1000)) +
                ' ' +
                getTrackBarString(
                    subscription.audioResource.playbackDuration / 1000,
                    subscription.currentTrack!.duration!,
                    20
                ) +
                ' ' +
                secondsToColonsString(subscription.currentTrack!.duration!) +
                '`'
        );
    } else {
        embedmsg.addField(
            '\u200B',
            '`Track is running since: ' + String(subscription.audioResource.playbackDuration / 1000) + ' seconds`'
        );
    }

    if (subscription.queue.length > 0) {
        embedmsg.addField('\u200B', '**Next:**');

        for (let i = 0; i < 2; i++) {
            if (i + 1 > subscription.queue.length) break;
            embedmsg.addField(
                i + 1 + ': `' + subscription.queue[i].name + '`',
                subscription.queue[i].requestor +
                    (subscription.queue[i].announce ? ' 📣' : '') +
                    ' | ' +
                    subscription.queue[i].displayUrl
            );
        }
    }
    const row = new MessageActionRow().addComponents([
        new MessageButton().setCustomId('np_restart').setEmoji('⏮️').setStyle('SECONDARY'),
        new MessageButton().setCustomId('np_stop').setEmoji('⏹️').setStyle('SECONDARY'),
        new MessageButton()
            .setCustomId('np_pauseresume')
            .setEmoji(subscription.audioPlayer.state.status === AudioPlayerStatus.Paused ? '▶️' : '⏸️')
            .setStyle('SECONDARY'),
        new MessageButton().setCustomId('np_skip').setEmoji('⏭️').setStyle('SECONDARY'),
        new MessageButton()
            .setCustomId('np_repeat')
            .setEmoji('🔂')
            .setStyle(subscription.getRepeat() ? 'SUCCESS' : 'SECONDARY')
    ]);

    return [embedmsg, row];
}
