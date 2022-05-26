import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BetterClient from '../../client';
import { createEmbed, createErrorEmbed, safeReply } from '../../helpers';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip to the next track, or further.')
        .addNumberOption((option) =>
            option.setName('input').setDescription('Skip how many tracks?').setRequired(false)
        ),
    run: (
        client: BetterClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) =>
        new Promise<void>(async (done, error) => {
            if (interaction) {
                let input = interaction instanceof CommandInteraction ? interaction.options.getNumber('input') : 0;
                if (!input) input = 0;

                try {
                    const queue = await client.musicManager.skip(interaction, input);
                    let msg = '';
                    if (queue.length == 0) {
                        msg = '`No more tracks in queue. Audio has stopped playing.`';
                    } else {
                        msg = '`✅ ' + String(input) + (input == 1 ? ' track' : ' tracks') + ' skipped';
                        if (input == 0) msg = '`✅ Skipped to the next track';
                        msg = msg + ' [' + (queue.length - 1) + ' more in queue]`';
                    }
                    await safeReply(interaction, createEmbed('Skipped', msg, true));
                    done();
                } catch (err) {
                    await safeReply(interaction, createErrorEmbed('🚩 Error skipping track(s): `' + err + '`', true));
                    error(err);
                }
            }
        })
};
