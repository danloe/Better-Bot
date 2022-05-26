import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BetterClient from '../../client';
import { createEmbed, createErrorEmbed, safeReply } from '../../helpers';

export const command: Command = {
    data: new SlashCommandBuilder().setName('pause').setDescription('Pause the currently palying track.'),
    run: (
        client: BetterClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) =>
        new Promise<void>(async (done, error) => {
            if (interaction) {
                try {
                    await client.musicManager.pause(interaction);
                    await safeReply(
                        interaction,
                        createEmbed('Paused', '`✅ The current track is now on pause.`', true)
                    );
                    done();
                } catch (err) {
                    await safeReply(interaction, createErrorEmbed('🚩 Error pausing the track: `' + err + '`', true));
                    error(err);
                }
            }
        })
};
