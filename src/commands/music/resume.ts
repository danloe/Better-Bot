import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BetterClient from '../../client';
import { createEmbed, createErrorEmbed, replyInteraction } from '../../helpers';

export const command: Command = {
    data: new SlashCommandBuilder().setName('resume').setDescription('Resume a paused track.'),
    run: async (
        client: BetterClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) => {
        new Promise<void>(async (done, error) => {
            if (interaction) {
                await client.musicManager
                    .resume(interaction)
                    .then(async () => {
                        await replyInteraction(
                            interaction,
                            createEmbed('Resumed', '`✅ The audio has been resumed.`', false)
                        );
                    })
                    .then(done)
                    .catch(async (err) => {
                        await replyInteraction(
                            interaction,
                            createErrorEmbed('🚩 Error resuming the track: `' + err + '`')
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
