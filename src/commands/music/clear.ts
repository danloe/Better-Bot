import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BetterClient from '../../client';
import { createEmbed, createErrorEmbed, safeReply } from '../../helpers';

export const command: Command = {
    data: new SlashCommandBuilder().setName('clear').setDescription('Remove all tracks from the queue.'),
    run: (
        client: BetterClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) => new Promise<void>(async (done, error) => {
        if (interaction) {
            try {
                await client.musicManager.clear(interaction);
                await safeReply(interaction, createEmbed('Cleared', '`✅ The Queue is now empty.`', false));
                done();
            } catch (err) {
                try {
                    await safeReply(interaction, createErrorEmbed('🚩 Error clearing queue: `' + err + '`'));
                } catch (err2) {
                    console.log(err2);
                }
                console.log(err);
                error(err);
            }
        }
    })
};
