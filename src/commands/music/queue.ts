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
import { createErrorEmbed, safeDeferReply, safeReply } from '../../helpers';
import { command as skip } from './skip';
import { command as clear } from './clear';
import { command as shuffle } from './shuffle';
import { MusicSubscription, Queue } from '../../classes';

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
                    const queue = await client.musicManager.getQueue(interaction);

                    if (queue) {
                        let subscription = client.musicManager.subscriptions.get(interaction.guildId!);

                        startCollector(client, interaction, subscription!, queue);

                        await safeReply(interaction, {
                            embeds: [queue.getQueueMessageEmbed(subscription!)],
                            components: [queue.getQueueMessageRow()]
                        });
                        done();
                    }
                } catch (err) {
                    try {
                        await safeReply(interaction, createErrorEmbed('🚩 Error showing the queue: `' + err + '`'));
                    } catch (err2) {
                        console.log(err2);
                    }
                    console.log(err);
                    error(err);
                }
            }
        })
};

function startCollector(
    client: BetterClient,
    interaction: CommandInteraction | ButtonInteraction,
    subscription: MusicSubscription,
    queue: Queue
) {
    const collector = interaction.channel!.createMessageComponentCollector({
        componentType: 'BUTTON',
        time: 60000
    });

    collector.on('collect', async (button) => {
        try {
            await button.deferUpdate();
            if (button.user.id === interaction.user.id) {
                switch (button.customId) {
                    case 'queue_previous':
                        if (queue.currentPage > 1) {
                            queue.currentPage--;
                        }
                        break;
                    case 'queue_skip':
                        await skip.run(client, button);
                        break;
                    case 'queue_clear':
                        await clear.run(client, button);
                        break;
                    case 'queue_shuffle':
                        await shuffle.run(client, button);
                        break;
                    case 'queue_next':
                        if (queue.currentPage < queue.totalPages) {
                            queue.currentPage++;
                        }
                        break;
                }
                await safeReply(interaction, {
                    embeds: [queue.getQueueMessageEmbed(subscription)],
                    components: [queue.getQueueMessageRow()]
                });
                collector.stop();
                startCollector(client, interaction, subscription, queue);
            } else {
                try {
                    await safeReply(button, createErrorEmbed("`⛔ These buttons aren't for you.`", true));
                } catch (err) {
                    console.log(err);
                }
            }
        } catch (err) {
            console.log(err);
        }
    });

    collector.on('end', async (_, reason) => {
        if (reason === 'time') {
            try {
                await safeReply(interaction, {
                    embeds: [queue.getQueueMessageEmbed(subscription)],
                    components: []
                });
            } catch (err) {
                console.log(err);
            }
        }
    });
}
