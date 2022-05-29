import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BotterinoClient from '../../client';
import { createErrorEmbed, safeDeferReply, safeReply } from '../../helpers';
import { command as skip } from './skip';
import { command as clear } from './clear';
import { command as shuffle } from './shuffle';
import { MusicSubscription, Queue } from '../../classes';

export const command: Command = {
    data: new SlashCommandBuilder().setName('queue').setDescription('Show the Queue.'),
    run: (
        client: BotterinoClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) =>
        new Promise<void>(async (done, error) => {
            if (interaction) {
                try {
                    const queue = client.musicManager.getQueue(interaction);
                    const subscription = client.musicManager.subscriptions.get(interaction.guildId!)!;
                    startCollector(interaction, subscription);

                    done();
                } catch (err) {
                    await safeReply(interaction, createErrorEmbed('🚩 Error showing the queue: `' + err + '`', true));
                    error(err);
                }
            }
        })
};

async function startCollector(interaction: CommandInteraction | ButtonInteraction, subscription: MusicSubscription) {
    const collector = interaction.channel!.createMessageComponentCollector({
        componentType: 'BUTTON',
        time: 60000
    });

    collector.on('collect', async (button) => {
        try {
            await safeDeferReply(button);
            switch (button.customId) {
                case 'queue_previous':
                    if (subscription.queue.currentPage > 1) {
                        subscription.queue.currentPage--;
                    }
                    break;
                case 'queue_skip':
                    await skip.run(subscription.client, button);
                    break;
                case 'queue_clear':
                    await clear.run(subscription.client, button);
                    break;
                case 'queue_shuffle':
                    await shuffle.run(subscription.client, button);
                    break;
                case 'queue_next':
                    if (subscription.queue.currentPage < subscription.queue.totalPages) {
                        subscription.queue.currentPage++;
                    }
                    break;
            }
            collector.stop();
            startCollector(interaction, subscription);
        } catch (err) {
            console.log(err);
        }
    });

    collector.on('end', async (_, reason) => {
        if (reason === 'time') {
            try {
                await safeReply(interaction, {
                    embeds: [subscription.queue.getQueueMessageEmbed(subscription)],
                    components: []
                });
            } catch (err) {
                console.log(err);
            }
        }
    });

    await safeReply(interaction, {
        embeds: [subscription.queue.getQueueMessageEmbed(subscription)],
        components: [subscription.queue.getQueueMessageRow()]
    });
}
