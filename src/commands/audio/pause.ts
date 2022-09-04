import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BotterinoClient from '../../client';
import { createEmbed, createErrorEmbed, safeDeferReply, safeReply } from '../../helpers';

export const command: Command = {
    data: new SlashCommandBuilder().setName('pause').setDescription('Pause the currently palying track.'),
    run: (
        client: BotterinoClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) =>
        new Promise<void>(async (done, error) => {
            if (interaction) {
                try {
                    await client.musicManager.pause(interaction.guildId!);

                    if (interaction instanceof CommandInteraction) {
                        await safeReply(
                            client,
                            interaction,
                            createEmbed('Paused', '`🔺 The current track is now on pause.`', true)
                        );
                    } else {
                        await safeDeferReply(client, interaction);
                    }

                    done();
                } catch (err) {
                    await safeReply(
                        client,
                        interaction,
                        createErrorEmbed('🚩 Error pausing the track: `' + err + '`', true)
                    );
                    error(err);
                }
            }
        })
};
