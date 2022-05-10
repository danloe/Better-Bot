import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BetterClient from '../../client';
import { createEmbed, createErrorEmbed, replyInteraction } from '../../helpers';

export const command: Command = {
    data: new SlashCommandBuilder().setName('clear').setDescription('Remove all tracks from the queue.'),
    run: async (
        client: BetterClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) => {
        new Promise<void>(async (done, error) => {
            if (interaction) {
                await client.musicManager
                    .clear(interaction)
                    .then(async () => {
                        await replyInteraction(
                            interaction,
                            createEmbed('Cleared', '`✅ The Queue is now empty.`', false)
                        );
                    })
                    .then(done)
                    .catch(async (err) => {
                        await replyInteraction(interaction, createErrorEmbed('🚩 Error clearing queue: `' + err + '`'));
                        error(err);
                    });
                if (message) {
                    //NOT PLANNED
                }
            }
        });
    }
};
