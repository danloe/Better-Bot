import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BotterinoClient from '../../client';
import { createEmbed, createErrorEmbed, safeDeferReply, safeReply } from '../../helpers';

export const command: Command = {
    data: new SlashCommandBuilder().setName('clear').setDescription('Remove all tracks from the queue.'),
    run: (
        client: BotterinoClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) =>
        new Promise<void>(async (done, error) => {
            if (interaction) {
                try {
                    await client.musicManager.clear(interaction.guildId!);

                    if (interaction instanceof CommandInteraction) {
                        await safeReply(
                            client,
                            interaction,
                            createEmbed('Cleared', '`🔺 The Queue is now empty.`', true)
                        );
                    } else {
                        await safeDeferReply(client, interaction);
                    }

                    done();
                } catch (err) {
                    await safeReply(
                        client,
                        interaction,
                        createErrorEmbed('🚩 Error clearing queue: `' + err + '`', true)
                    );
                    error(err);
                }
            }
        })
};
