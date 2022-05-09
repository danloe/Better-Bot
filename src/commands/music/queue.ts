import { Command } from '../../interfaces';
import { CommandInteraction, Message, MessageEmbed } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BetterClient from '../../client';
import { Queue } from '../../classes';
import { createErrorEmbed } from '../../helpers';

export const command: Command = {
    data: new SlashCommandBuilder().setName('queue').setDescription('Show the Queue.'),
    run: async (client: BetterClient, interaction?: CommandInteraction, message?: Message, args?: string[]) => {
        if (interaction) {
            await client.musicManager
                .showQueue(interaction)
                .then(async (queue: Queue) => {
                    let embedmsg = new MessageEmbed().setColor('#403075').setTitle('Queue');

                    if (queue) {
                        let subscription = client.musicManager.subscriptions.get(interaction.guildId);
                        if (subscription) {
                            if (subscription.currentTrack) {
                                embedmsg.addField(
                                    'Now playing:',
                                    '`' + subscription.currentTrack.name + '` | ' + subscription.currentTrack.displayUrl
                                );
                            }
                        }

                        for (let i = 0; i < queue.length; i++) {
                            embedmsg.addField(
                                i + 1 + ': `' + queue[i].name + '`',
                                queue[i].requestor + ' | ' + queue[i].displayUrl
                            );
                        }
                        await interaction.reply({
                            embeds: [embedmsg],
                            ephemeral: false
                        });
                    }
                })
                .catch(async (reason) => {
                    console.log(reason);
                    await interaction.followUp(createErrorEmbed(String(reason), true));
                });

            if (message) {
                //NOT PLANNED
            }
        }
    }
};
