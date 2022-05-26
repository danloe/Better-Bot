import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BetterClient from '../../client';
import { createEmbed, createErrorEmbed, safeReply } from '../../helpers';

export const command: Command = {
    data: new SlashCommandBuilder().setName('resume').setDescription('Resume a paused track.'),
    run: (
        client: BetterClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) =>
        new Promise<void>(async (done, error) => {
            if (interaction) {
                try {
                    await client.musicManager.resume(interaction);
                    await safeReply(interaction, createEmbed('Resumed', '`✅ The audio has been resumed.`', true));
                    done();
                } catch (err) {
                    await safeReply(interaction, createErrorEmbed('🚩 Error resuming the track: `' + err + '`', true));
                    error(err);
                }
            }
        })
};
