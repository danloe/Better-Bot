import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BetterClient from '../../client';
import { createEmbed, createErrorEmbed, safeReply } from '../../helpers';

export const command: Command = {
    data: new SlashCommandBuilder().setName('stop').setDescription('Stop audio playback.'),
    run: (
        client: BetterClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) =>
        new Promise<void>(async (done, error) => {
            if (interaction) {
                try {
                    await client.musicManager.stop(interaction);
                    await safeReply(interaction, createEmbed('Stopped', '`✅ The audio playback has stopped.`', true));
                    done();
                } catch (err) {
                    await safeReply(interaction, createErrorEmbed('🚩 Error stopping the track: `' + err + '`', true));
                    error(err);
                }
            }
        })
};
