import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, GuildMember, Message } from 'discord.js';
import BotterinoClient from '../../client';
import { createErrorEmbed, safeDeferReply, safeReply } from '../../helpers';
import { SlashCommandBuilder } from '@discordjs/builders';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('soundboard')
        .setDescription('Play a sound.')
        .addStringOption((option) =>
            option
                .setName('input')
                .setDescription('Select a sound from the autocomplete.')
                .setRequired(true)
                .setAutocomplete(true)
        ),
    run: (
        client: BotterinoClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) =>
        new Promise<void>(async (done, error) => {
            if (interaction) {
                try {
                    const input =
                        interaction instanceof CommandInteraction ? interaction.options.getString('input') : '';
                    await safeDeferReply(client, interaction, true);
                    await client.musicManager.playSound(interaction.guildId!, <GuildMember>interaction.member, input!);
                    await safeReply(client, interaction, '`🔊 ' + input + '`');
                    done();
                } catch (err) {
                    await safeReply(client, interaction, createErrorEmbed('🚩 Error playing sound: `' + err + '`'));
                    error(err);
                }
            }
        })
};
