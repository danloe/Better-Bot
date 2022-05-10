import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BetterClient from '../../client';
import { createEmbed, createErrorEmbed, replyInteraction } from '../../helpers';

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
                await replyInteraction(interaction, createEmbed('Cleared', '`✅ The Queue is now empty.`', false));
                done();
            } catch (err) {
                try {
                    await replyInteraction(interaction, createErrorEmbed('🚩 Error clearing queue: `' + err + '`'));
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
    })
};
