import { Command } from '../../interfaces';
import {
    ButtonInteraction,
    CommandInteraction,
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
import { command as shuffle } from './shuffle';
import { command as repeat } from './repeat';
import { command as queueCommand } from './queue';
import { MusicSubscription, PlayerStatus } from '../../classes';
import { APIMessage } from 'discord-api-types/v10';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('np')
        .setDescription('Shows the title currently being played.')
        .addBooleanOption((option) =>
            option.setName('set').setDescription('Enable Now Playing Message?').setRequired(false)
        )
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

                    const subscription = client.musicManager.getSubscription(interaction.guildId!);

                    let msgText = '';

                    if (input !== null) {
                        subscription.displayNowPlayingMessage = input;
                        msgText = '`🔺 Is now turned ' + (input ? 'on`' : 'off`');
                    }

                    if (channel) {
                        if (channel.type === 'GUILD_TEXT' || channel.type === 'GUILD_VOICE') {
                            subscription.lastChannel = channel;
                            msgText += (input !== null ? '\n`' : '`') + '🔺 Bound to channel #' + channel.name + '`';
                        } else {
                            msgText += (input !== null ? '\n`' : '`') + '🔺 Cannot bind to this channel type.`';
                        }
                    }

                    if (input !== null || channel) {
                        await safeReply(client, interaction, createEmbed('Now Playing Message', msgText, true), true);
                    } else {
                        if (
                            !subscription.currentTrack ||
                            !subscription.audioResource ||
                            subscription.playerStatus != PlayerStatus.Playing
                        ) {
                            await safeReply(
                                client,
                                interaction,
                                createEmbed('Error', '🔺 There is nothing being played', true),
                                true
                            );
                        } else {
                            startNowPlayingCollector(client, subscription, interaction);
                        }
                    }

                    done();
                } catch (err: any) {
                    await safeReply(
                        client,
                        interaction,
                        createErrorEmbed('🚩 Error setting the volume: `' + err + '`', true)
                    );
                    error(err);
                }
            }
        })
};

export async function startNowPlayingCollector(
    client: BotterinoClient,
    subscription: MusicSubscription,
    interaction?: CommandInteraction | ButtonInteraction
) {
    if (!subscription.npCollector || subscription.npCollector?.ended) {
        subscription.npCollector = subscription.lastChannel!.createMessageComponentCollector({
            componentType: 'BUTTON',
            time: client.config.music.nowPlayingMessageInteractionTimeout * 1000
        });
    }

    subscription.npCollector.on('collect', async (button) => {
        try {
            await safeDeferReply(client, button);
            subscription.npCollector.stop();
            switch (button.customId) {
                case 'np_restart':
                    await restart.run(subscription.client, button);
                    startNowPlayingCollector(client, subscription);
                    break;
                case 'np_stop':
                    await stop.run(subscription.client, button);
                    startNowPlayingCollector(client, subscription);
                    break;
                case 'np_pauseresume':
                    if (
                        subscription.playerStatus == PlayerStatus.Stopped ||
                        subscription.playerStatus == PlayerStatus.Paused
                    ) {
                        await resume.run(subscription.client, button);
                    } else {
                        await pause.run(subscription.client, button);
                    }
                    startNowPlayingCollector(client, subscription);
                    break;
                case 'np_skip':
                    await skip.run(subscription.client, button);
                    break;
                case 'np_shuffle':
                    await shuffle.run(subscription.client, button);
                    startNowPlayingCollector(client, subscription);
                    break;
                case 'np_repeat':
                    await repeat.run(subscription.client, button);
                    startNowPlayingCollector(client, subscription);
                    break;
                case 'np_queue':
                    await queueCommand.run(subscription.client, button);
                    startNowPlayingCollector(client, subscription);
                    break;
            }
        } catch (err: any) {
            client.logger.debug(err);
        }
    });

    subscription.npCollector.on('end', async (_, reason) => {
        if (reason === 'time') {
            try {
                if (subscription.playerStatus == PlayerStatus.Playing) {
                    startNowPlayingCollector(client, subscription);
                } else {
                    if (subscription.lastNowPlayingMessage) {
                        const [msgembed, _] = getNowPlayingMessage(subscription);
                        await subscription.lastNowPlayingMessage
                            .fetch()
                            .then((msg) => {
                                msg.edit({
                                    embeds: [msgembed],
                                    components: []
                                });
                            })
                            .catch();
                    }
                }
            } catch (err: any) {
                client.logger.debug(err);
            }
        }
    });

    const [msgembed, rows] = getNowPlayingMessage(subscription);

    let lastMessage!: Message | APIMessage;
    await subscription.lastNowPlayingMessage
        ?.fetch()
        .then(async (msg) => {
            if (msg?.deletable) await msg.delete();
        })
        .catch();

    if (interaction) {
        lastMessage = <Message>await safeReply(client, interaction, {
            embeds: [msgembed],
            components: [...rows]
        });
    } else {
        lastMessage = await subscription.lastChannel.send({
            embeds: [msgembed],
            components: [...rows]
        });
    }
    subscription.lastNowPlayingMessage = lastMessage;
}

export function getNowPlayingMessage(
    subscription: MusicSubscription
): [message: MessageEmbed, rows: MessageActionRow[]] {
    let embedmsg = new MessageEmbed().setColor('#403075');

    if (subscription.currentTrack) {
        embedmsg
            .setTitle(subscription.currentTrack.title)
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
    } else if (subscription.audioResource?.playbackDuration > 0) {
        embedmsg.addField(
            '\u200B',
            '`Track is running since: ' + String(subscription.audioResource.playbackDuration / 1000) + ' seconds`'
        );
    }

    if (subscription.queue.length > 0) {
        embedmsg.addField('\u200B', '🔺 **Next:**');

        for (let i = 0; i < 2; i++) {
            if (i + 1 > subscription.queue.length) break;
            embedmsg.addField(
                i + 1 + ': `' + subscription.queue[i].title + '`',
                subscription.queue[i].requestor +
                    (subscription.queue[i].announce ? ' 📣' : '') +
                    ' | ' +
                    subscription.queue[i].displayUrl
            );
        }
    }
    const row1 = new MessageActionRow().addComponents([
        new MessageButton().setCustomId('np_restart').setEmoji('⏮️').setStyle('SECONDARY'),
        new MessageButton().setCustomId('np_stop').setEmoji('⏹️').setStyle('SECONDARY'),
        new MessageButton()
            .setCustomId('np_pauseresume')
            .setEmoji(
                subscription.playerStatus == PlayerStatus.Stopped ||
                    subscription.playerStatus == PlayerStatus.Paused ||
                    subscription.playerStatus == PlayerStatus.Idle
                    ? '▶️'
                    : '⏸️'
            )
            .setStyle('SECONDARY'),
        new MessageButton()
            .setCustomId('np_skip')
            .setEmoji('⏭️')
            .setDisabled(!subscription.queue.hasTracks())
            .setStyle('SECONDARY')
    ]);

    const row2 = new MessageActionRow().addComponents([
        new MessageButton()
            .setCustomId('np_queue')
            .setEmoji('🔢')
            .setStyle('SECONDARY')
            .setDisabled(!subscription.queue.hasTracks()),
        new MessageButton()
            .setCustomId('np_shuffle')
            .setEmoji('🔀')
            .setStyle('SECONDARY')
            .setDisabled(subscription.queue.length < 2),
        new MessageButton()
            .setCustomId('np_repeat')
            .setEmoji('🔂')
            .setStyle(subscription.repeat ? 'SUCCESS' : 'SECONDARY')
    ]);

    return [embedmsg, [row1, row2]];
}
