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
import BetterClient from '../../client';
import { Queue } from '../../classes';
import { createErrorEmbed, replyDefer, replyInteraction } from '../../helpers';
import { command as skip } from './skip';
import { command as clear } from './clear';
import { command as shuffle } from './shuffle';

export const command: Command = {
    data: new SlashCommandBuilder().setName('queue').setDescription('Show the Queue.'),
    run: (
        client: BetterClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) =>
        new Promise<void>(async (done, error) => {
            if (interaction) {
                try {
                    const queue = await client.musicManager.showQueue(interaction);
                    let embedmsg = new MessageEmbed().setColor('#403075').setTitle('Queue');
                    const row = new MessageActionRow().addComponents([
                        new MessageButton()
                            .setCustomId('queue_previous')
                            .setLabel('⬅️')
                            .setStyle('SECONDARY')
                            .setDisabled(true),
                        new MessageButton().setCustomId('queue_skip').setLabel('⏭️ Skip').setStyle('SECONDARY'),
                        new MessageButton().setCustomId('queue_clear').setLabel('🚮 Clear').setStyle('DANGER'),
                        new MessageButton().setCustomId('queue_shuffle').setLabel('🔀 Shuffle').setStyle('SECONDARY'),
                        new MessageButton()
                            .setCustomId('queue_next')
                            .setLabel('➡️')
                            .setStyle('SECONDARY')
                            .setDisabled(true)
                    ]);

                    if (queue) {
                        let subscription = client.musicManager.subscriptions.get(interaction.guildId!);
                        if (subscription) {
                            if (subscription.currentTrack) {
                                embedmsg.addField(
                                    'Now playing:',
                                    '`' +
                                        subscription.currentTrack.name +
                                        '`\n' +
                                        subscription.currentTrack.requestor +
                                        ' | ' +
                                        subscription.currentTrack.displayUrl
                                );
                            }
                        }

                        for (let i = 0; i < queue.length; i++) {
                            embedmsg.addField(
                                i + 1 + ': `' + queue[i].name + '`',
                                queue[i].requestor + ' | ' + queue[i].displayUrl
                            );
                        }

                        const collector = interaction.channel!.createMessageComponentCollector({
                            componentType: 'BUTTON',
                            time: 60_000
                        });

                        collector.on('collect', async (button) => {
                            await replyDefer(button);
                            if (button.user.id === interaction.user.id) {
                                switch (button.customId) {
                                    case 'queue_previous':
                                        break;
                                    case 'queue_skip':
                                        try {
                                            await skip.run(client, button)
                                        } catch (e) {
                                            error(e);
                                        }
                                        break;
                                    case 'queue_clear':
                                        try {
                                            await clear.run(client, button)
                                        } catch (e) {
                                            error(e);
                                        }
                                        break;
                                    case 'queue_shuffle':
                                        try {
                                            await shuffle.run(client, button)
                                        } catch (e) {
                                            error(e);
                                        }
                                        break;
                                    case 'queue_next':
                                        break;
                                }
                            } else {
                                await replyInteraction(
                                    button,
                                    createErrorEmbed("`⛔ These buttons aren't for you.`", true)
                                );
                            }
                        });

                        collector.on('end', async (collection) => {
                            await replyInteraction(interaction, {
                                embeds: [embedmsg],
                                components: []
                            });
                        });

                        await replyInteraction(interaction, {
                            embeds: [embedmsg],
                            components: [row]
                        });
                    }
                } catch (err) {
                    try {
                        await replyInteraction(
                            interaction,
                            createErrorEmbed('🚩 Error showing the queue: `' + err + '`')
                        );
                    } catch (err2) {
                        console.log(err2);
                    }
                    console.log(err);
                    console.error(err);
                }

                if (message) {
                    //NOT PLANNED
                }
            }
        })
};
