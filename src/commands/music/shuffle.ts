import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BetterClient from '../../client';
import { createEmbed, createErrorEmbed, replyInteraction } from '../../helpers';

export const command: Command = {
    data: new SlashCommandBuilder().setName('shuffle').setDescription('Shuffle all tracks in the queue.'),
    run: async (
        client: BetterClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) => {
        new Promise<void>(async (done, error) => {
            if (interaction) {
                await client.musicManager
                    .shuffle(interaction)
                    .then(async () => {
                        await replyInteraction(
                            interaction,
                            createEmbed('Shuffled', '`✅ The Queue is no longer in OOOORDER.`', false)
                        );
                    })
                    .then(done)
                    .catch(async (err) => {
                        await replyInteraction(
                            interaction,
                            createErrorEmbed('🚩 Error shuffling the queue: `' + err + '`')
                        );
                        error(err);
                    });
                if (message) {
                    //NOT PLANNED
                }
            }
        });
    }
};
