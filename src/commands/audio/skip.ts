import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, GuildMember, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BotterinoClient from '../../client';
import { createEmbed, createErrorEmbed, safeDeferReply, safeReply } from '../../helpers';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip to the next track, or further.')
        .addNumberOption((option) =>
            option.setName('input').setDescription('Skip how many tracks?').setRequired(false)
        ),
    run: (
        client: BotterinoClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) =>
        new Promise<void>(async (done, error) => {
            if (interaction) {
                let input = interaction instanceof CommandInteraction ? interaction.options.getNumber('input') : 0;
                if (!input) input = 0;

                try {
                    const subscription = await client.musicManager.skip(
                        interaction.guildId!,
                        <GuildMember>interaction.member,
                        input
                    );
                    let msg = '';
                    if (subscription.queue.length == 0) {
                        msg = '`No more tracks in queue. Audio has stopped playing.`';
                    } else {
                        msg = '`🔺 ' + String(input) + (input == 1 ? ' track' : ' tracks') + ' skipped';
                        if (input == 0) msg = '`🔺 Skipped to the next track';
                        msg = msg + ' [' + subscription.queue.length + ' more in queue]`';
                    }
                    if (interaction instanceof CommandInteraction) {
                        await safeReply(client, interaction, createEmbed('Skipped', msg, true));
                    } else {
                        await safeDeferReply(client, interaction);
                    }

                    done();
                } catch (err) {
                    await safeReply(
                        client,
                        interaction,
                        createErrorEmbed('🚩 Error skipping track(s): `' + err + '`', true)
                    );
                    error(err);
                }
            }
        })
};
