import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BotterinoClient from '../../client';
import { createEmbed, createErrorEmbed, safeReply } from '../../helpers';

export const command: Command = {
    data: new SlashCommandBuilder().setName('restart').setDescription('Restart the current track.'),
    run: (
        client: BotterinoClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) =>
        new Promise<void>(async (done, error) => {
            if (interaction) {
                try {
                    await client.musicManager.restart(interaction.guildId!);

                    await safeReply(
                        client,
                        interaction,
                        createEmbed('Restarted', '`🔺 The current track is now playing again.`', true)
                    );

                    done();
                } catch (err) {
                    await safeReply(
                        client,
                        interaction,
                        createErrorEmbed('🚩 Error restarting track: `' + err + '`', true)
                    );
                    error(err);
                }
            }
        })
};
