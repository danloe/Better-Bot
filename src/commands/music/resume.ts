import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BetterClient from '../../client';
import { createEmbed, createErrorEmbed, replyInteraction } from '../../helpers';

export const command: Command = {
    data: new SlashCommandBuilder().setName('resume').setDescription('Resume a paused track.'),
    run: (
        client: BetterClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) => new Promise<void>(async (done, error) => {
        if (interaction) {
            try {
                await client.musicManager.resume(interaction);
                await replyInteraction(
                    interaction,
                    createEmbed('Resumed', '`✅ The audio has been resumed.`', false)
                );
                done();
            } catch (err) {
                try {
                    await replyInteraction(
                        interaction,
                        createErrorEmbed('🚩 Error resuming the track: `' + err + '`')
                    );
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
