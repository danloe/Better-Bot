import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BotterinoClient from '../../client';
import { createEmbed, createErrorEmbed, safeDeferReply, safeReply } from '../../helpers';

export const command: Command = {
    data: new SlashCommandBuilder().setName('stop').setDescription('Stop audio playback.'),
    run: (
        client: BotterinoClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) =>
        new Promise<void>(async (done, error) => {
            if (interaction) {
                try {
                    await client.musicManager.stop(interaction.guildId!);

                    if (interaction instanceof CommandInteraction) {
                        await safeReply(
                            client,
                            interaction,
                            createEmbed('Stopped', '`🔺 The audio has stopped.`', true)
                        );
                    } else {
                        await safeDeferReply(client, interaction);
                    }

                    done();
                } catch (err) {
                    await safeReply(
                        client,
                        interaction,
                        createErrorEmbed('🚩 Error stopping the track: `' + err + '`', true)
                    );
                    error(err);
                }
            }
        })
};
