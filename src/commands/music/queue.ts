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
    ) => {
        return new Promise<void>(async (done, error) => {
            if (interaction) {
                try {
                    const queue = await client.musicManager.showQueue(interaction);

                    if (queue) {
                        let embedmsg = new MessageEmbed().setColor('#403075').setTitle('Queue');
                        const row = new MessageActionRow().addComponents([
                            new MessageButton()
                                .setCustomId('queue_previous')
                                .setLabel('⬅️')
                                .setStyle('SECONDARY')
                                .setDisabled(true),
                            new MessageButton().setCustomId('queue_skip').setLabel('⏭️ Skip').setStyle('SECONDARY'),
                            new MessageButton().setCustomId('queue_clear').setLabel('🚮 Clear').setStyle('DANGER'),
                            new MessageButton()
                                .setCustomId('queue_shuffle')
                                .setLabel('🔀 Shuffle')
                                .setStyle('SECONDARY'),
                            new MessageButton()
                                .setCustomId('queue_next')
                                .setLabel('➡️')
                                .setStyle('SECONDARY')
                                .setDisabled(true)
                        ]);

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
                            try {
                                await replyDefer(button);
                                if (button.user.id === interaction.user.id) {
                                    switch (button.customId) {
                                        case 'queue_previous':
                                            break;
                                        case 'queue_skip':
                                            try {
                                                await skip.run(client, button);
                                            } catch (e) {}
                                            break;
                                        case 'queue_clear':
                                            try {
                                                await clear.run(client, button);
                                            } catch (e) {}
                                            break;
                                        case 'queue_shuffle':
                                            try {
                                                shuffle.run(client, button);
                                            } catch (e) {}
                                            break;
                                        case 'queue_next':
                                            break;
                                    }
                                } else {
                                    try {
                                        await replyInteraction(
                                            button,
                                            createErrorEmbed("`⛔ These buttons aren't for you.`", true)
                                        );
                                    } catch (err) {
                                        console.log(err);
                                    }
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        });

                        collector.on('end', async (collection) => {
                            try {
                                await replyInteraction(interaction, {
                                    embeds: [embedmsg],
                                    components: []
                                });
                            } catch (err) {
                                console.log(err);
                            }
                        });

                        await replyInteraction(interaction, {
                            embeds: [embedmsg],
                            components: [row]
                        });
                        done();
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
                    error(err);
                }

                if (message) {
                    //NOT PLANNED
                }
            }
        });
    }
};
