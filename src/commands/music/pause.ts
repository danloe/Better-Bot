import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BetterClient from '../../client';
import { createEmbed, createErrorEmbed, replyInteraction } from '../../helpers';

export const command: Command = {
    data: new SlashCommandBuilder().setName('pause').setDescription('Pause the currently palying track.'),
    run: async (
        client: BetterClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) => {
        new Promise<void>(async (done, error) => {
            if (interaction) {
                await client.musicManager
                    .pause(interaction)
                    .then(async () => {
                        await replyInteraction(
                            interaction,
                            createEmbed('Paused', '`✅ The current track is now on hold.`', false)
                        );
                    })
                    .then(done)
                    .catch(async (err) => {
                        await replyInteraction(
                            interaction,
                            createErrorEmbed('🚩 Error pausing the track: `' + err + '`')
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
