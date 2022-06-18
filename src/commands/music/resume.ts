import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, GuildMember, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BotterinoClient from '../../client';
import { createEmbed, createErrorEmbed, safeDeferReply, safeReply } from '../../helpers';

export const command: Command = {
    data: new SlashCommandBuilder().setName('resume').setDescription('Resume a paused track.'),
    run: (
        client: BotterinoClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) =>
        new Promise<void>(async (done, error) => {
            if (interaction) {
                try {
                    await safeDeferReply(client, interaction);
                    await client.musicManager.resume(interaction.guildId!, <GuildMember>interaction.member);
                    await safeReply(
                        client,
                        interaction,
                        createEmbed('Resumed', '`🔺 The audio has been resumed.`', true)
                    );

                    done();
                } catch (err) {
                    await safeReply(
                        client,
                        interaction,
                        createErrorEmbed('🚩 Error resuming the track: `' + err + '`', true)
                    );
                    error(err);
                }
            }
        })
};
