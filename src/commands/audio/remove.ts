import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, GuildMember, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BotterinoClient from '../../client';
import { createEmbed, createErrorEmbed, safeDeferReply, safeReply } from '../../helpers';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove items from the queue.')
        .addStringOption((option) =>
            option
                .setName('items')
                .setDescription('Item positions to remove. Separate multiple items with a comma.')
                .setRequired(true)
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
                    const input =
                        interaction instanceof CommandInteraction ? interaction.options.getString('items') : '';

                    // parse the input
                    const items = input!
                        .split(',')
                        .map((item) => parseInt(item.trim(), 10))
                        .filter((item) => !isNaN(item));

                    await client.musicManager.remove(interaction.guildId!, items);
                    await safeReply(
                        client,
                        interaction,
                        createEmbed('Removed', '`🔺 Tracks have been removed from the queue.`', true)
                    );

                    done();
                } catch (err) {
                    await safeReply(
                        client,
                        interaction,
                        createErrorEmbed('🚩 Error removing items: `' + err + '`', true)
                    );
                    error(err);
                }
            }
        })
};
