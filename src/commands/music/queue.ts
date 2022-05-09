import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message, MessageActionRow, MessageButton, MessageEmbed } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BetterClient from '../../client';
import { Queue } from '../../classes';
import { createErrorEmbed, replyDefer } from '../../helpers';
import { command as skip } from './skip';
import { command as clear } from './clear';
import { command as shuffle } from './shuffle';

export const command: Command = {
    data: new SlashCommandBuilder().setName('queue').setDescription('Show the Queue.'),
    run: async (client: BetterClient, interaction?: CommandInteraction | ButtonInteraction, message?: Message, args?: string[]) => {
        if (interaction) {
            await client.musicManager
                .showQueue(interaction)
                .then(async (queue: Queue) => {
                    let embedmsg = new MessageEmbed().setColor('#403075').setTitle('Queue');
                    const row = new MessageActionRow().addComponents([
                        new MessageButton()
                            .setCustomId('queue_previous')
                            .setLabel('⬅️ Previous')
                            .setStyle('SECONDARY')
                            .setDisabled(true),
                        new MessageButton().setCustomId('queue_skip').setLabel('⏭️ Skip').setStyle('SECONDARY'),
                        new MessageButton().setCustomId('queue_clear').setLabel('🚮 Clear').setStyle('DANGER'),
                        new MessageButton().setCustomId('queue_shuffle').setLabel('🔀 Shuffle').setStyle('SECONDARY'),
                        new MessageButton()
                            .setCustomId('queue_next')
                            .setLabel('➡️ Next')
                            .setStyle('SECONDARY')
                            .setDisabled(true)
                    ]);

                    if (queue) {
                        let subscription = client.musicManager.subscriptions.get(interaction.guildId!);
                        if (subscription) {
                            if (subscription.currentTrack) {
                                embedmsg.addField(
                                    'Now playing:',
                                    '`' + subscription.currentTrack.name + '`\n' + subscription.currentTrack.displayUrl
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

                        collector.on('collect', (i) => {
                            replyDefer(i);
                            if (i.user.id === interaction.user.id) {
                                switch (i.customId) {
                                    case 'queue_previous':
                                        break;
                                    case 'queue_skip':
                                        skip.run(client, i);
                                        break;
                                    case 'queue_clear':
                                        clear.run(client, i);
                                        break;
                                    case 'queue_shuffle':
                                        shuffle.run(client, i);
                                        break;
                                    case 'queue_next':
                                        break;
                                }
                            } else {
                                i.editReply(createErrorEmbed("⛔ These buttons aren't for you.", true));
                            }
                        });

                        await interaction.editReply({
                            embeds: [embedmsg],
                            components: [row]
                        });
                    }
                })
                .catch((err) => {
                    interaction.editReply(createErrorEmbed('🚩 Error showing the queue: `' + err + '`'));
                });

            if (message) {
                //NOT PLANNED
            }
        }
    }
};
